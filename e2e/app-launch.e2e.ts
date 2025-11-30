import { device, expect, element, by, waitFor } from "detox";

type ElementWithOr = ReturnType<typeof element> & {
  or: (
    matcher: ReturnType<typeof by.id> | ReturnType<typeof by.text>
  ) => ReturnType<typeof element>;
};

describe("App Launch", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("should launch app successfully", async () => {
    await expect(element(by.id("app-root"))).toBeVisible();
  });

  it("should show home screen or login screen", async () => {
    // Wait for app to load
    const homeOrLogin = (element(by.id("home-screen")) as ElementWithOr).or(
      by.id("login-screen")
    );
    await waitFor(homeOrLogin).toBeVisible().withTimeout(5000);
  });

  it("should have navigation working", async () => {
    // Check if navigation elements are present
    const navOrBrand = (element(by.id("navigation")) as ElementWithOr).or(
      by.text("SpareCarry")
    );
    await waitFor(navOrBrand).toBeVisible().withTimeout(3000);
  });
});
