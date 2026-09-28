import { SafeArea } from "@apps-in-toss/web-framework";

// 하단 고정 CTA가 홈 인디케이터/제스처 바에 겹치지 않도록, 기기별 실제 여백을
// CSS 변수로 흘려보낸다. 값이 바뀌면(회전 등) 자동으로 다시 반영된다.
export function initSafeArea(): () => void {
  const apply = (insets: { bottom: number }) => {
    document.documentElement.style.setProperty("--inset-bottom", `${insets.bottom}px`);
  };

  try {
    apply(SafeArea.get());
  } catch {
    apply({ bottom: 0 });
  }

  try {
    return SafeArea.subscribe({ onEvent: apply });
  } catch {
    return () => {};
  }
}
