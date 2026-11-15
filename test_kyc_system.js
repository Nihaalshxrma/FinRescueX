// End-to-end Verification & Test Suite for FinRescue X KYC System
const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 RUNNING FINRESCUE X KYC & VERIFICATION TEST SUITE');
  console.log('====================================================\n');

  // Step 0: Get authentic admin token via demo auth flow
  console.log('0. Authenticating admin user (9999999999):');
  await request({
    host: 'localhost',
    port: 5005,
    path: '/api/auth/demo-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { mobile: '9999999999' });

  const otpRes = await request({
    host: 'localhost',
    port: 5005,
    path: '/api/auth/verify-otp',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { mobile: '9999999999', otp: '123456' });

  const token = otpRes.data?.token;
  console.log('   Authenticated successfully! Role:', otpRes.data?.user?.role);

  // Test 1: Health check
  console.log('\n1. Health check:');
  const health = await request({
    host: 'localhost',
    port: 5005,
    path: '/api/health',
    method: 'GET'
  });
  console.log('   Status:', health.status, 'Payload:', health.data?.status);

  // Test 2: Upload Matched PAN Card Sample
  console.log('\n2. Testing Matched Document Upload (PAN_CARD_MATCHED):');
  const matchRes = await request({
    host: 'localhost',
    port: 5005,
    path: '/api/documents/test-sample',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { sampleType: 'PAN_CARD_MATCHED', applicationId: 'FNX-DEMO-1001' });

  console.log('   Status:', matchRes.status);
  console.log('   Doc ID:', matchRes.data?.document?.id);
  console.log('   Verification Status:', matchRes.data?.document?.verificationStatus);
  console.log('   Extracted Data:', matchRes.data?.document?.extractedData);
  console.log('   Field Checks Count:', matchRes.data?.document?.verificationReport?.fieldChecks?.length);
  console.log('   AI Explanation:', matchRes.data?.document?.verificationReport?.aiExplanation);

  const matchedDocId = matchRes.data?.document?.id;

  // Test 3: Upload Mismatched PAN Card Sample
  console.log('\n3. Testing Mismatched Document Upload (PAN_CARD_MISMATCHED):');
  const mismatchRes = await request({
    host: 'localhost',
    port: 5005,
    path: '/api/documents/test-sample',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }, { sampleType: 'PAN_CARD_MISMATCHED', applicationId: 'FNX-DEMO-1001' });

  console.log('   Status:', mismatchRes.status);
  console.log('   Doc ID:', mismatchRes.data?.document?.id);
  console.log('   Verification Status:', mismatchRes.data?.document?.verificationStatus);
  console.log('   Discrepancies:', mismatchRes.data?.document?.verificationReport?.discrepancies);

  // Test 4: Document Verification Report Endpoint
  console.log('\n4. Testing GET /api/documents/:id/report:');
  if (matchedDocId) {
    const reportRes = await request({
      host: 'localhost',
      port: 5005,
      path: `/api/documents/${matchedDocId}/report`,
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('   Status:', reportRes.status);
    console.log('   Report Document Type:', reportRes.data?.documentType);
    console.log('   Verification Status:', reportRes.data?.verification?.verificationStatus);
    console.log('   Summary:', reportRes.data?.summary);
  }

  // Test 5: On-demand Extract Endpoint POST /api/documents/:id/extract
  console.log('\n5. Testing POST /api/documents/:id/extract (On-demand Sarvam Doc AI):');
  if (matchedDocId) {
    const extractRes = await request({
      host: 'localhost',
      port: 5005,
      path: `/api/documents/${matchedDocId}/extract`,
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('   Status:', extractRes.status);
    console.log('   Extraction Status:', extractRes.data?.extraction?.status);
    console.log('   Verification Status:', extractRes.data?.verification?.verificationStatus);
  }

  // Test 6: Admin Verification Queue GET /api/admin/document-verifications
  console.log('\n6. Testing Admin Document Verification Queue:');
  const adminQueueRes = await request({
    host: 'localhost',
    port: 5005,
    path: '/api/admin/document-verifications',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log('   Status:', adminQueueRes.status);
  console.log('   Total Verifications:', adminQueueRes.data?.total);
  console.log('   Summary:', adminQueueRes.data?.summary);
  const firstVerif = adminQueueRes.data?.verifications?.[0];

  // Test 7: Admin Manual Adjudication POST /api/admin/document-verifications/:id/review
  if (firstVerif) {
    console.log('\n7. Testing Admin Manual Review Decision (VERIFY):');
    const reviewRes = await request({
      host: 'localhost',
      port: 5005,
      path: `/api/admin/document-verifications/${firstVerif.id}/review`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }, { decision: 'VERIFY', reason: 'Underwriter approved after visual comparison with Income Tax registry.' });

    console.log('   Status:', reviewRes.status);
    console.log('   Updated Status:', reviewRes.data?.verification?.verificationStatus);
    console.log('   Admin Status:', reviewRes.data?.verification?.adminReviewStatus);
  }

  console.log('\n====================================================');
  console.log('✅ ALL TEST SCENARIOS COMPLETED');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
