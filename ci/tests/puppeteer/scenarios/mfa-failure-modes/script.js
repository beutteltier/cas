const puppeteer = require('puppeteer');
const assert = require('assert');
const cas = require('../../cas.js');

(async () => {
    const browser = await puppeteer.launch(cas.browserOptions());
    const page = await cas.newPage(browser);

    let service = "https://httpbin.org/anything/closed"
    await cas.logg("Checking CLOSED failure mode");
    await page.goto(`https://localhost:8443/cas/login?service=${service}`);
    await cas.loginWith(page, "casuser", "Mellon");
    await page.waitForTimeout(1000)
    await cas.assertInnerText(page, "#content h2", "MFA Provider Unavailable")

    await page.goto(`https://localhost:8443/cas/logout`);

    service = "https://httpbin.org/anything/phantom"
    await cas.logg("Checking PHANTOM failure mode");
    await page.goto(`https://localhost:8443/cas/login?service=${service}`);
    await cas.loginWith(page, "casuser", "Mellon");
    await page.waitForTimeout(1000)
    let ticket = await cas.assertTicketParameter(page)
    let body = await cas.doRequest(`https://localhost:8443/cas/p3/serviceValidate?service=${service}&ticket=${ticket}&format=JSON`);
    await cas.logg(body)
    let json = JSON.parse(body.toString());
    let authenticationSuccess = json.serviceResponse.authenticationSuccess;
    assert(authenticationSuccess.attributes.bypassMultifactorAuthentication[0] === true)
    assert(authenticationSuccess.attributes.bypassedMultifactorAuthenticationProviderId[0] === "mfa-yubikey")
    assert(authenticationSuccess.attributes.authenticationContext[0] === "mfa-yubikey")

    await page.goto(`https://localhost:8443/cas/logout`);

    service = "https://httpbin.org/anything/open"
    await cas.logg("Checking OPEN failure mode");
    await page.goto(`https://localhost:8443/cas/login?service=${service}`);
    await cas.loginWith(page, "casuser", "Mellon");
    await page.waitForTimeout(1000)
    ticket = await cas.assertTicketParameter(page)
    body = await cas.doRequest(`https://localhost:8443/cas/p3/serviceValidate?service=${service}&ticket=${ticket}&format=JSON`);
    await cas.logg(body)
    json = JSON.parse(body.toString());
    authenticationSuccess = json.serviceResponse.authenticationSuccess;
    assert(authenticationSuccess.attributes.bypassMultifactorAuthentication[0] === true)
    assert(authenticationSuccess.attributes.bypassedMultifactorAuthenticationProviderId[0] === "mfa-yubikey")
    assert(authenticationSuccess.attributes.authenticationContext == null)

    await page.goto(`https://localhost:8443/cas/logout`);

    service = "https://httpbin.org/anything/none"
    await cas.logg("Checking NONE failure mode");
    await page.goto(`https://localhost:8443/cas/login?service=${service}`);
    await cas.loginWith(page, "casuser", "Mellon");
    await page.waitForTimeout(1000)
    await cas.assertTextContent(page, "#login h3", "Use your registered YubiKey device(s) to authenticate.");
    await cas.assertVisibility(page, "#token");

    await page.goto(`https://localhost:8443/cas/logout`);
    service = "https://httpbin.org/anything/undefined"
    await cas.logg("Checking UNDEFINED failure mode");
    await page.goto(`https://localhost:8443/cas/login?service=${service}`);
    await cas.loginWith(page, "casuser", "Mellon");
    await page.waitForTimeout(1000)
    ticket = await cas.assertTicketParameter(page)
    body = await cas.doRequest(`https://localhost:8443/cas/p3/serviceValidate?service=${service}&ticket=${ticket}&format=JSON`);
    await cas.logg(body)
    json = JSON.parse(body.toString());
    authenticationSuccess = json.serviceResponse.authenticationSuccess;
    assert(authenticationSuccess.attributes.bypassMultifactorAuthentication[0] === true)
    assert(authenticationSuccess.attributes.bypassedMultifactorAuthenticationProviderId[0] === "mfa-yubikey")
    assert(authenticationSuccess.attributes.authenticationContext[0] === "mfa-yubikey")

    await browser.close();
})();
