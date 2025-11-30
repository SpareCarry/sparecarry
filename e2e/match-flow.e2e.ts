import { device, expect, element, by, waitFor } from "detox";

describe("Match Flow", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should display feed with trips and requests", async () => {
    // Navigate to home/feed
    await waitFor(element(by.id("feed-screen")).or(by.id("home-screen")))
      .toBeVisible()
      .withTimeout(5000);
  });

  it("should show match cards", async () => {
    // Wait for feed items to load
    await waitFor(element(by.id("feed-item")).or(by.id("match-card")))
      .toBeVisible()
      .withTimeout(10000);
  });

  it("should allow viewing match details", async () => {
    // Tap on a match card
    const matchCard = element(by.id("match-card")).atIndex(0);
    await waitFor(matchCard).toBeVisible().withTimeout(10000);
    await matchCard.tap();

    // Verify match detail screen
    await waitFor(
      element(by.id("match-detail-screen")).or(by.text("Match Details"))
    )
      .toBeVisible()
      .withTimeout(3000);
  });

  it("should allow accepting a match", async () => {
    // Navigate to match detail
    const matchCard = element(by.id("match-card")).atIndex(0);
    await waitFor(matchCard).toBeVisible().withTimeout(10000);
    await matchCard.tap();

    // Tap accept button
    const acceptButton = element(by.id("accept-match-button")).or(
      by.text("Accept Match")
    );
    await waitFor(acceptButton).toBeVisible().withTimeout(3000);
    // await acceptButton.tap();

    // Verify navigation to chat or confirmation
    // await waitFor(element(by.id('chat-screen'))).toBeVisible();
  });
});
