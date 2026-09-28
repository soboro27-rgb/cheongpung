const KAKAO_AUTH_URL = "https://kauth.kakao.com/oauth/authorize";
const KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token";
const KAKAO_USER_URL = "https://kapi.kakao.com/v2/user/me";
const KAKAO_FRIENDS_URL = "https://kapi.kakao.com/v1/api/talk/friends";
const KAKAO_MESSAGE_URL = "https://kapi.kakao.com/v1/api/talk/friends/message/default/send";

// 카카오 로그인 시 요청할 동의항목. friends/talk_message는 카카오 디벨로퍼스에서
// 별도 사용권한 심사를 통과해야 실제로 응답에 포함/동작함 (README 참고).
const SCOPES = "friends,talk_message";

// 카카오 앱 심사 전 화면/플로우를 로컬에서 확인하기 위한 목업 모드.
// .env에서 MOCK_KAKAO=true 로 켜면 실제 카카오 API를 호출하지 않는다.
export function isMockMode(): boolean {
  return process.env.MOCK_KAKAO === "true";
}

const MOCK_FRIENDS: KakaoFriend[] = [
  { uuid: "mock-uuid-1", nickname: "김민준" },
  { uuid: "mock-uuid-2", nickname: "이서연" },
  { uuid: "mock-uuid-3", nickname: "박도윤" },
  { uuid: "mock-uuid-4", nickname: "최지우" },
  { uuid: "mock-uuid-5", nickname: "정하은" },
  { uuid: "mock-uuid-6", nickname: "강태양" },
];

export function getKakaoAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.KAKAO_REST_API_KEY ?? "",
    redirect_uri: process.env.KAKAO_REDIRECT_URI ?? "",
    response_type: "code",
    scope: SCOPES,
  });
  return `${KAKAO_AUTH_URL}?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export async function exchangeCodeForToken(code: string): Promise<TokenResponse> {
  const res = await fetch(KAKAO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: process.env.KAKAO_REST_API_KEY ?? "",
      redirect_uri: process.env.KAKAO_REDIRECT_URI ?? "",
      code,
    }),
  });
  if (!res.ok) throw new Error(`카카오 토큰 교환 실패: ${await res.text()}`);
  return res.json();
}

export interface KakaoProfile {
  kakaoId: string;
  nickname: string;
  thumbnailUrl?: string;
}

export async function getKakaoProfile(accessToken: string): Promise<KakaoProfile> {
  const res = await fetch(KAKAO_USER_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`카카오 프로필 조회 실패: ${await res.text()}`);
  const data = await res.json();
  return {
    kakaoId: String(data.id),
    nickname: data.kakao_account?.profile?.nickname ?? "이름없음",
    thumbnailUrl: data.kakao_account?.profile?.thumbnail_image_url,
  };
}

export interface KakaoFriend {
  uuid: string;
  nickname: string;
  thumbnailUrl?: string;
}

// 주의: 카카오는 "friends" 동의항목이 있어도, 상대방이 카카오 계정에서
// 친구 목록 제공에 동의한 경우에만 응답에 포함시킨다. 즉 사용자의
// 카카오톡 친구 전체가 아니라 그 중 일부만 조회될 수 있다.
export async function getKakaoFriends(accessToken: string): Promise<KakaoFriend[]> {
  if (isMockMode()) return MOCK_FRIENDS;

  const friends: KakaoFriend[] = [];
  const limit = 100;
  let offset = 0;
  for (;;) {
    const res = await fetch(`${KAKAO_FRIENDS_URL}?offset=${offset}&limit=${limit}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`카카오 친구목록 조회 실패: ${await res.text()}`);
    const data = await res.json();
    const elements: Array<{ uuid: string; profile_nickname: string; profile_thumbnail_image?: string }> =
      data.elements ?? [];
    friends.push(
      ...elements.map((el) => ({
        uuid: el.uuid,
        nickname: el.profile_nickname,
        thumbnailUrl: el.profile_thumbnail_image,
      })),
    );
    if (elements.length < limit) break;
    offset += limit;
  }
  return friends;
}

export async function sendKakaoFriendMessage(
  accessToken: string,
  uuids: string[],
  linkUrl: string,
  text: string,
): Promise<unknown> {
  if (isMockMode()) {
    console.log(`[mock kakao send] to ${uuids.join(", ")} -> ${linkUrl}\n${text}`);
    return { mock: true };
  }

  const template = {
    object_type: "text",
    text,
    link: { web_url: linkUrl, mobile_web_url: linkUrl },
    button_title: "답변하기",
  };
  const res = await fetch(KAKAO_MESSAGE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      receiver_uuids: JSON.stringify(uuids),
      template_object: JSON.stringify(template),
    }),
  });
  if (!res.ok) throw new Error(`카카오 메시지 발송 실패: ${await res.text()}`);
  return res.json();
}
