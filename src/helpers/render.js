import { Tag } from "@douyinfe/semi-ui";

export function renderText(text, limit) {
  if (text.length > limit) {
    return text.slice(0, limit - 3) + "...";
  }
  return text;
}

/**
 * Render group tags based on the input group string
 * @param {string} group - The input group string
 * @returns {JSX.Element} - The rendered group tags
 */
export function renderGroup(group) {
  if (group === "") {
    return (
      <Tag size="large" key="default">
        unknown
      </Tag>
    );
  }

  const tagColors = {
    vip: "yellow",
    pro: "yellow",
    svip: "red",
    premium: "red",
  };

  const groups = group.split(",").sort();

  return (
    <span key={group}>
      {groups.map((group) => (
        <Tag
          size="large"
          color={tagColors[group] || stringToColor(group)}
          key={group}
        >
          {group}
        </Tag>
      ))}
    </span>
  );
}

export function renderNumber(num) {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  } else if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 10000) {
    return (num / 1000).toFixed(1) + "k";
  } else {
    return num;
  }
}

export function renderQuotaNumberWithDigit(num, digits = 2) {
  let displayInCurrency = localStorage.getItem("display_in_currency");
  num = num.toFixed(digits);
  if (displayInCurrency) {
    return "$" + num;
  }
  return num;
}

export function renderNumberWithPoint(num) {
  num = num.toFixed(2);
  if (num >= 100000) {
    // Convert number to string to manipulate it
    let numStr = num.toString();
    // Find the position of the decimal point
    let decimalPointIndex = numStr.indexOf(".");

    let wholePart = numStr;
    let decimalPart = "";

    // If there is a decimal point, split the number into whole and decimal parts
    if (decimalPointIndex !== -1) {
      wholePart = numStr.slice(0, decimalPointIndex);
      decimalPart = numStr.slice(decimalPointIndex);
    }

    // Take the first two and last two digits of the whole number part
    let shortenedWholePart = wholePart.slice(0, 2) + ".." + wholePart.slice(-2);

    // Return the formatted number
    return shortenedWholePart + decimalPart;
  }

  // If the number is less than 100,000, return it unmodified
  return num;
}

export function getQuotaPerUnit() {
  let quotaPerUnit = localStorage.getItem("quota_per_unit");
  quotaPerUnit = parseFloat(quotaPerUnit);
  return quotaPerUnit;
}

export function renderUnitWithQuota(quota) {
  let quotaPerUnit = localStorage.getItem("quota_per_unit");
  quotaPerUnit = parseFloat(quotaPerUnit);
  quota = parseFloat(quota);
  return quotaPerUnit * quota;
}

export function getQuotaWithUnit(quota, digits = 6) {
  let quotaPerUnit = localStorage.getItem("quota_per_unit");
  quotaPerUnit = parseFloat(quotaPerUnit);
  return (quota / quotaPerUnit).toFixed(digits);
}

export function renderQuotaWithAmount(amount) {
  let displayInCurrency = localStorage.getItem("display_in_currency");
  displayInCurrency = displayInCurrency === "true";
  if (displayInCurrency) {
    return "$" + amount;
  } else {
    return renderUnitWithQuota(amount);
  }
}

export function renderQuota(quota, digits = 2) {
  let quotaPerUnit = 500000;
  return "$" + (quota / quotaPerUnit).toFixed(digits);
}

export function renderModelPrice(
  inputTokens,
  completionTokens,
  modelRatio,
  modelPrice = -1,
  completionRatio,
  groupRatio
) {
  // 1 ratio = $0.002 / 1K tokens
  if (modelPrice !== -1) {
    return "Model price:$" + modelPrice * groupRatio;
  } else {
    if (completionRatio === undefined) {
      completionRatio = 0;
    }
    // The *2 here is because 1 ratio = $0.002, please do not delete
    let inputRatioPrice = modelRatio * 2.0 * groupRatio;
    let completionRatioPrice = modelRatio * 2.0 * completionRatio * groupRatio;
    let price =
      (inputTokens / 1000000) * inputRatioPrice +
      (completionTokens / 1000000) * completionRatioPrice;
    return (
      <>
        <article>
          <p>Prompt ${inputRatioPrice} / 1M tokens</p>
          <p>Completion ${completionRatioPrice} / 1M tokens</p>
          <p></p>
          <p>
            Prompt {inputTokens} tokens / 1M tokens * ${inputRatioPrice} +
            Completion {completionTokens} tokens / 1M tokens * $
            {completionRatioPrice} = ${price.toFixed(6)}
          </p>
        </article>
      </>
    );
  }
}

export function renderQuotaWithPrompt(quota, digits) {
  let displayInCurrency = localStorage.getItem("display_in_currency");
  displayInCurrency = displayInCurrency === "true";
  if (displayInCurrency) {
    return `(Equivalent amount:${renderQuota(quota, digits)}）`;
  }
  return "";
}

const colors = [
  "amber",
  "blue",
  "cyan",
  "green",
  "grey",
  "indigo",
  "light-blue",
  "lime",
  "orange",
  "pink",
  "purple",
  "red",
  "teal",
  "violet",
  "yellow",
];

export const modelColorMap = {
  "dall-e": "rgb(147,112,219)", // dark purple
  // 'dall-e-2': 'rgb(147,112,219)', // A shade between purple and blue
  "dall-e-3": "rgb(153,50,204)", // A shade between violet and magenta
  "gpt-3.5-turbo": "rgb(184,227,167)", // light green
  // 'gpt-3.5-turbo-0301': 'rgb(131,220,131)', // bright green
  "gpt-3.5-turbo-0613": "rgb(60,179,113)", // sea green
  "gpt-3.5-turbo-1106": "rgb(32,178,170)", // light sea green
  "gpt-3.5-turbo-16k": "rgb(149,252,206)", // light orange
  "gpt-3.5-turbo-16k-0613": "rgb(119,255,214)", // light peach
  "gpt-3.5-turbo-instruct": "rgb(175,238,238)", // powder blue
  "gpt-4": "rgb(135,206,235)", // sky blue
  // 'gpt-4-0314': 'rgb(70,130,180)', // steel blue
  "gpt-4-0613": "rgb(100,149,237)", // cornflower blue
  "gpt-4-1106-preview": "rgb(30,144,255)", // dodger blue
  "gpt-4-0125-preview": "rgb(2,177,236)", // deep sky blue
  "gpt-4-turbo-preview": "rgb(2,177,255)", // deep sky blue
  "gpt-4-32k": "rgb(104,111,238)", // medium purple
  // 'gpt-4-32k-0314': 'rgb(90,105,205)', // dark slate blue
  "gpt-4-32k-0613": "rgb(61,71,139)", // dark blue gray
  "gpt-4-all": "rgb(65,105,225)", // royal blue
  "gpt-4-gizmo-*": "rgb(0,0,255)", // pure blue
  "gpt-4-vision-preview": "rgb(25,25,112)", // midnight blue
  "text-ada-001": "rgb(255,192,203)", // pink
  "text-babbage-001": "rgb(255,160,122)", // light coral
  "text-curie-001": "rgb(219,112,147)", // pale violet red
  // 'text-davinci-002': 'rgb(199,21,133)', // medium violet red
  "text-davinci-003": "rgb(219,112,147)", // pale violet red(same series as Curie)
  "text-davinci-edit-001": "rgb(255,105,180)", // hot pink
  "text-embedding-ada-002": "rgb(255,182,193)", // light pink
  "text-embedding-v1": "rgb(255,174,185)", // light pink (slightly different)
  "text-moderation-latest": "rgb(255,130,171)", // strong pink
  "text-moderation-stable": "rgb(255,160,122)", // light coral(same function as Babbage)
  "tts-1": "rgb(255,140,0)", // dark orange
  "tts-1-1106": "rgb(255,165,0)", // orange
  "tts-1-hd": "rgb(255,215,0)", // gold
  "tts-1-hd-1106": "rgb(255,223,0)", // golden yellow (slightly different)
  "whisper-1": "rgb(245,245,220)", // beige
  "claude-3-opus-20240229": "rgb(255,132,31)", // orange-red
  "claude-3-sonnet-20240229": "rgb(253,135,93)", // orange
  "claude-3-haiku-20240307": "rgb(255,175,146)", // light orange
  "claude-2.1": "rgb(255,209,190)", // light orange(slightly different)
};

export function stringToColor(str) {
  let sum = 0;
  // Operate on each character in the string
  for (let i = 0; i < str.length; i++) {
    // Add the ASCII value of the character to sum
    sum += str.charCodeAt(i);
  }
  // Use modulo operation to get a single digit
  let i = sum % colors.length;
  return colors[i];
}
