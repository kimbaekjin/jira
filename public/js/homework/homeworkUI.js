import { MAX_GAUGE } from "../data/data.js";

export async function autoUpdateDailyGaugesDB(characterName) {
  try {
    const res = await fetch(
      `/api/homework/${encodeURIComponent(characterName)}`
    );

    let homeworkData = await res.json();
    if (!Array.isArray(homeworkData)) homeworkData = [];

    // ✅ 이제 서버가 6시 처리하니까 아무것도 안함
    return homeworkData;

  } catch (e) {
    console.error("DB 기반 일일 숙제 불러오기 실패", e);
    return [];
  }
}

export function initHomeworkUI(name, card, homeworkData) {
  const hwTasks = card.querySelectorAll(".hw-task");

  hwTasks.forEach(taskEl => {
    const taskName = taskEl.dataset.task;
    const checkbox = taskEl.querySelector(".hw-checkbox");

    checkbox.addEventListener("change", () => {
    taskEl.classList.toggle("checked", checkbox.checked);

    taskEl.classList.remove("pop");
    void taskEl.offsetWidth;
    taskEl.classList.add("pop");
  });

    // -------------------- 할의모래시계 --------------------
    if (taskName === "할의모래시계") {
      const gaugeWrapper = taskEl.querySelector(".hw-gauge");
      if (gaugeWrapper) gaugeWrapper.style.display = "none";

      const taskData = homeworkData.find(
        h => h.task_name === taskName
      );

      if (checkbox && taskData) {
        checkbox.checked = !!taskData.checked;
      }

      if (checkbox) {
        checkbox.addEventListener("change", async () => {
          await fetch(
            `/api/homework/${encodeURIComponent(name)}/${encodeURIComponent(taskName)}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                checked: checkbox.checked,
                gauge: 0
              })
            }
          );
        });
      }

      return;
    }

    // -------------------- 일반 숙제 --------------------
    const gaugeFill = taskEl.querySelector(".hw-gauge-fill");

    const taskData = homeworkData.find(
      h => h.task_name === taskName
    );

    let maxGauge = MAX_GAUGE;
    let step = 40;

    if (taskName === "가디언토벌") {
      maxGauge = 100;
      step = 20;
    }

    let gauge = taskData ? taskData.gauge : maxGauge;

    if (checkbox && taskData) {
      checkbox.checked = !!taskData.checked;
    }

    if (gaugeFill) {
      gaugeFill.style.width = `${(gauge / maxGauge) * 100}%`;
      gaugeFill.innerText = `${gauge} / ${maxGauge}`;
    }

    // -------------------- 입력창 --------------------
    const input = document.createElement("input");
    input.type = "number";
    input.min = 0;
    input.max = maxGauge;
    input.value = gauge;
    input.style.width = "50px";
    input.style.marginLeft = "10px";
    input.style.display = "none";

    taskEl.querySelector("label").appendChild(input);

    // -------------------- 버튼 --------------------
    const btn = document.createElement("button");
    btn.innerText = "게이지 수정";
    btn.style.marginLeft = "10px";
    btn.style.fontSize = "12px";

    taskEl.querySelector("label").appendChild(btn);

    btn.addEventListener("click", () => {
      input.style.display =
        input.style.display === "none" ? "inline-block" : "none";

      if (input.style.display !== "none") input.focus();
    });

    // -------------------- 입력 처리 --------------------
    input.addEventListener("blur", async () => {
      let val = parseInt(input.value);

      if (isNaN(val)) val = gauge;

      if (val < 0 || val > maxGauge || val % step !== 0) {
        input.value = gauge;
        return;
      }

      gauge = val;

      if (gaugeFill) {
        gaugeFill.style.width = `${(gauge / maxGauge) * 100}%`;
        gaugeFill.innerText = `${gauge} / ${maxGauge}`;
      }

      await fetch(
        `/api/homework/${encodeURIComponent(name)}/${encodeURIComponent(taskName)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checked: checkbox.checked,
            gauge
          })
        }
      );
    });

    // -------------------- 체크박스 --------------------
    if (checkbox) {
      checkbox.addEventListener("change", async () => {
      console.log("change 실행됨");
        if (checkbox.checked) {
          // 체크 → 감소
          if (gauge >= step) {
            gauge -= step;
          }
        } else {
          // 체크 해제 → 증가 (🔥 여기 조건 제거)
          gauge += step;
          if (gauge > maxGauge) gauge = maxGauge;
        }

        if (input) input.value = gauge;

        if (gaugeFill) {
          gaugeFill.style.width = `${(gauge / maxGauge) * 100}%`;
          gaugeFill.innerText = `${gauge} / ${maxGauge}`;
        }
        console.log("체크 변경", {
            taskName,
            before: gauge,
            checked: checkbox.checked
          });

        await fetch(
          `/api/homework/${encodeURIComponent(name)}/${encodeURIComponent(taskName)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              checked: checkbox.checked,
              gauge
            })
          }
        );
      });
    }
  });
}