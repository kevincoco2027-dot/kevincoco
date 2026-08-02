/**
 * Runtime helpers for the WhatsApp AI assistant.
 * Provides config, usage tracking, prompt hydration and token estimation.
 */

export interface AiConfig {
  debugMode?: boolean;
  blockedPhones?: string[];
  adminAlertPhone?: string;
  testAsClient?: boolean;
  isEnabled?: boolean;
  adminPrompt?: string;
  customerPrompt?: string;
  smartNotifications?: boolean;
  messageThresholdForPause?: number;
}

export interface AiUsage {
  imagesSentToday?: number;
  testAsClient?: boolean;
  awaitingComprobante?: boolean;
  pendingOrderId?: string | null;
  hasNoPendingOrders?: boolean;
  maintenanceNotifiedTs?: number;
  blocked?: boolean;
  spamBlocked?: boolean;
  lastStallReplyTs?: number;
  messageCount?: number;
  customerName?: string;
  isRegistered?: boolean;
  isGuestWithOrders?: boolean;
  awaitingAltPhone?: boolean;
  welcomeShown?: boolean;
  adminTakeover?: boolean;
  registerPromptedAt?: number;
  lastMessageTimestamps?: number[];
  escalated?: boolean;
  promptTokens?: number;
  responseTokens?: number;
  totalTokens?: number;
}

export function estimateTokensFromText(text: string): number {
  return Math.ceil((text || '').length / 4);
}

let aiConfig: AiConfig = {};
let usageMap: Record<string, AiUsage> = {};

export async function getKeniaConfig(): Promise<AiConfig> {
  return aiConfig;
}

export async function getKeniaUsage(phone: string, blockedPhones?: string[]): Promise<AiUsage> {
  const usage = usageMap[phone] || {};
  if (blockedPhones?.includes(phone)) {
    return { ...usage, testAsClient: false };
  }
  return usage;
}

export async function recordKeniaUsage(phone: string, patch: Partial<AiUsage> & { imageSent?: boolean }): Promise<AiUsage> {
  const current = usageMap[phone] || {};
  const updated: AiUsage = {
    ...current,
    ...patch,
    imagesSentToday: patch.imageSent ? (current.imagesSentToday || 0) + 1 : current.imagesSentToday,
  };
  usageMap[phone] = updated;
  return updated;
}

export async function setKeniaBlocked(phone: string, blocked: boolean, _reason?: string): Promise<void> {
  if (blocked) {
    if (!aiConfig.blockedPhones) aiConfig.blockedPhones = [];
    if (!aiConfig.blockedPhones.includes(phone)) aiConfig.blockedPhones.push(phone);
  } else {
    aiConfig.blockedPhones = (aiConfig.blockedPhones || []).filter(p => p !== phone);
  }
}

export async function resetKeniaUsage(phone: string): Promise<void> {
  delete usageMap[phone];
}

export async function hydratePrompt(prompt: string, vars: Record<string, string> | string): Promise<string> {
  const varsMap = typeof vars === 'string' ? { SITE_URL: vars } : vars;
  return prompt.replace(/\{\{(\w+)\}\}/g, (_, key) => varsMap[key] || '');
}

export async function getKeniaRuntimeSnapshot() {
  return { config: aiConfig, usage: usageMap };
}
