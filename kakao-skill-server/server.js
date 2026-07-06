const express = require("express");
const routing = require("./routing.json");
const { notifyInquiry } = require("./notify");

const app = express();
app.use(express.json());

function matchProject(utterance) {
  const text = (utterance || "").toLowerCase();
  return routing.find((entry) => entry.keywords.some((k) => text.includes(k.toLowerCase())));
}

function simpleText(text) {
  return { version: "2.0", template: { outputs: [{ simpleText: { text } }] } };
}

app.get("/", (req, res) => res.send("kakao-skill-server OK"));

app.post("/skill", async (req, res) => {
  const utterance = req.body?.userRequest?.utterance || "";
  const matched = matchProject(utterance);

  notifyInquiry({ utterance, matchedProject: matched?.name }).catch((e) =>
    console.error("[notify] 실패:", e)
  );

  const reply = matched
    ? matched.reply
    : "문의 감사합니다. 담당자가 확인 후 빠르게 연락드리겠습니다.";

  res.json(simpleText(reply));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`kakao-skill-server listening on ${PORT}`));
