import { useEffect, useState } from "react";

// 화면 전환은 해시 라우팅 — 스와이프 뒤로가기/시스템 뒤로가기가 그대로 화면 이전으로 동작한다.
function read(): string {
  return window.location.hash.replace(/^#/, "") || "/";
}

export function useHashRoute() {
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const on = () => setRoute(read());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

export function go(path: string) {
  window.location.hash = path;
}

export function replace(path: string) {
  window.location.replace(`#${path}`);
}
