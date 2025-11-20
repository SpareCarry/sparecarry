import { device, expect, element, by, waitFor } from 'detox';

describe('Chat Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should navigate to messages screen', async () => {
    // Navigate to messages (adjust based on app navigation)
    const messagesButton = element(by.id('messages-button')).or(by.text('Messages'));
    await waitFor(messagesButton).toBeVisible().withTimeout(5000);
    await messagesButton.tap();
    
    await waitFor(element(by.id('messages-screen')).or(by.text('Messages')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should display conversation list', async () => {
    // Navigate to messages
    const messagesButton = element(by.id('messages-button')).or(by.text('Messages'));
    await waitFor(messagesButton).toBeVisible().withTimeout(5000);
    await messagesButton.tap();
    
    // Wait for conversations to load
    await waitFor(element(by.id('conversation-list')).or(by.id('conversation-item')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('should open a conversation', async () => {
    // Navigate to messages
    const messagesButton = element(by.id('messages-button')).or(by.text('Messages'));
    await waitFor(messagesButton).toBeVisible().withTimeout(5000);
    await messagesButton.tap();
    
    // Tap on a conversation
    const conversationItem = element(by.id('conversation-item')).atIndex(0);
    await waitFor(conversationItem).toBeVisible().withTimeout(10000);
    await conversationItem.tap();
    
    // Verify chat screen
    await waitFor(element(by.id('chat-screen')).or(by.id('message-input')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should send a message', async () => {
    // Navigate to chat (simplified - in real test, navigate through app)
    const messageInput = element(by.id('message-input')).or(by.label('Message'));
    await waitFor(messageInput).toBeVisible().withTimeout(10000);
    
    // Type message
    await messageInput.typeText('Test message');
    
    // Tap send button
    const sendButton = element(by.id('send-button')).or(by.text('Send'));
    await waitFor(sendButton).toBeVisible().withTimeout(3000);
    await sendButton.tap();
    
    // Verify message appears in chat
    await waitFor(element(by.text('Test message'))).toBeVisible().withTimeout(3000);
  });

  it('should display message bubbles', async () => {
    // Navigate to chat
    const messageBubble = element(by.id('message-bubble'));
    await waitFor(messageBubble).toBeVisible().withTimeout(10000);
  });
});

