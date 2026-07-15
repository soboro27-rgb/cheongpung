export interface AlimtalkMessage {
  to: string;      // recipient phone number
  templateCode: string;
  variables: Record<string, string>;
}

export interface AlimtalkResult {
  success: boolean;
  providerMsgId?: string;
  errorCode?: string;
}

export interface AlimtalkAdapter {
  send(messages: AlimtalkMessage[]): Promise<AlimtalkResult[]>;
}
