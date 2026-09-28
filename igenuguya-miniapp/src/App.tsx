import { useEffect, useRef, useState } from "react";
import { graniteEvent, Screen } from "@apps-in-toss/web-framework";
import "./App.css";
import { useHashRoute } from "./useHashRoute";
import { initSafeArea } from "./safeArea";
import Home from "./screens/Home";
import Pick, { type Person } from "./screens/Pick";
import Compose from "./screens/Compose";
import Detail from "./screens/Detail";

function App() {
  const route = useHashRoute();
  const routeRef = useRef(route);
  routeRef.current = route;
  const [selected, setSelected] = useState<Map<string, Person>>(new Map());

  useEffect(() => initSafeArea(), []);

  // 상단 네비게이션 바의 뒤로가기(시스템 뒤로가기 포함)를 구독한다. 첫 화면(홈)이면
  // 미니앱을 종료하고, 그 외 화면이면 해시 라우팅 히스토리를 한 단계 되돌린다.
  // 구독하는 순간 기본 종료 동작이 꺼지므로 홈에서는 직접 Screen.close()를 불러야 한다.
  useEffect(() => {
    return graniteEvent.addEventListener("backEvent", {
      onEvent: () => {
        if (routeRef.current === "/") void Screen.close();
        else window.history.back();
      },
    });
  }, []);

  let screen;
  if (route === "/pick") {
    screen = <Pick selected={selected} setSelected={setSelected} />;
  } else if (route === "/compose") {
    screen = selected.size > 0 ? (
      <Compose selected={selected} onSent={() => setSelected(new Map())} />
    ) : (
      <Pick selected={selected} setSelected={setSelected} />
    );
  } else if (route.startsWith("/batch/")) {
    screen = <Detail id={Number(route.slice("/batch/".length))} />;
  } else {
    screen = <Home />;
  }

  return <div className="canvas">{screen}</div>;
}

export default App;
