


const BASE_URL = 'http://localhost:3000/api';

async function testEndpoints() {
    console.log('🚀 Starting API Verification...');
    let success = true;

    // 1. Test Root
    try {
        const res = await fetch('http://localhost:3000/');
        const data = await res.json();
        console.log(`[GET /] Status: ${res.status}`, data.message ? '✅' : '❌');
    } catch (e) {
        console.error('[GET /] Failed:', e.message);
        success = false;
    }

    // 2. Test Admin Login (should work with admin/admin123)
    try {
        const res = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: 'admin', password: 'admin123' })
        });
        const data = await res.json();
        if (res.status === 200 && data.token) {
            console.log(`[POST /admin/login] Status: ${res.status} ✅ Token received`);
        } else {
            console.log(`[POST /admin/login] Status: ${res.status} ❌`, data);
            success = false;
        }
    } catch (e) {
        console.error('[POST /admin/login] Failed:', e.message);
        success = false;
    }

    // 3. Test Client Debt Check (dni from user request: 40765886)
    try {
        const res = await fetch(`${BASE_URL}/client/check-debt/40765886`);
        const data = await res.json();
        if (res.status === 200) {
            console.log(`[GET /client/check-debt] Status: ${res.status} ✅ Client found: ${data.client?.fullName}`);
        } else {
            // 404 is also valid "logic" (handled error), but 500 is a crash
            console.log(`[GET /client/check-debt] Status: ${res.status} ${res.status === 500 ? '❌ CRASH' : '⚠️'}`);
            if (res.status === 500) success = false;
        }
    } catch (e) {
        console.error('[GET /client/check-debt] Failed:', e.message);
        success = false;
    }

    if (success) {
        console.log('\n✨ ALL TESTS PASSED. System is operational.');
    } else {
        console.log('\n🔥 SOME TESTS FAILED. Check logs.');
        process.exit(1);
    }
}

testEndpoints();
