import isValid from "date-fns/isValid";
import parse from "date-fns/parse";
import { MDXRemote } from "next-mdx-remote/rsc";
import getActiveDayNumber from "../../lib/getActiveDayNumber";
import getCurrentSprintNumber from "../../lib/getCurrentSprintNumber";

function getAugmentedMd(
  md: string,
  startDate: Date | undefined,
  startSprint: number | undefined,
  weekdaysPerSprint: number | undefined
) {
  const activeDayNumber = getActiveDayNumber(startDate, weekdaysPerSprint);
  const currentSprintNumber = getCurrentSprintNumber(
    startDate,
    startSprint,
    weekdaysPerSprint
  );

  const lines = md.split("\n");
  let isCurrentDay = false;
  const newLines = lines.map((line) => {
    const normalizedLine = line.replace(/[^\w:]+/gm, "").toLowerCase();

    if (currentSprintNumber !== undefined) {
      if (currentSprintNumber > 0) {
        const prevSprintNumber = currentSprintNumber - 1;
        // Replace [previous sprint] with "Sprint <number>"
        line = line.replace(
          "previous sprint",
          `<span className="prev-sprint">previous sprint \`[${prevSprintNumber}]\`</span>`
        );
      } else {
        line = line.replace(
          "previous sprint",
          `<span className="prev-sprint">previous sprint (_N/A_)</span>`
        );
      }

      // Replace [current sprint] with "Sprint <number>"
      line = line.replace(
        "current sprint",
        `<span className="current-sprint">current sprint \`[${currentSprintNumber}]\`</span>`
      );
      line = line.replace(
        "this sprint",
        `<span className="current-sprint">this sprint \`[${currentSprintNumber}]\`</span>`
      );

      // Replace [next sprint] with "Sprint <number>"
      const nextSprintNumber = currentSprintNumber + 1;
      line = line.replace(
        "next sprint",
        `<span className="next-sprint">next sprint \`[${nextSprintNumber}]\`</span>`
      );
      line = line.replace(
        "following sprint",
        `<span className="next-sprint">following sprint \`[${nextSprintNumber}]\`</span>`
      );
    }

    // Highlight current day
    const isDayLine = normalizedLine.startsWith("day");
    const isCurrentDayLine =
      activeDayNumber !== undefined &&
      normalizedLine.startsWith("day" + activeDayNumber + ":");
    if (isDayLine && !isCurrentDayLine) {
      isCurrentDay = false;
    } else if (isDayLine && isCurrentDayLine) {
      isCurrentDay = true;
    }
    if (isCurrentDay) {
      return ">" + line;
    }

    return line;
  });

  return (
    (currentSprintNumber !== undefined && currentSprintNumber >= 0
      ? `<div><big><strong><span className="current-sprint">Current Sprint ${currentSprintNumber}</span></strong></big></div>\n`
      : "") + newLines.join("\n")
  );
}

export default async function ClientPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | undefined };
}) {
  const {
    primaryColor: rawPrimaryColor,
    startDate: rawStartDate,
    startSprint: rawStartSprint,
    weekdaysPerSprint: rawWeekdaysPerSprint,
    md: md,
  } = searchParams ?? {};
  const primaryColor = rawPrimaryColor || "#ffc107";
  const parsedDate = rawStartDate
    ? parse(`${rawStartDate}`, "yyyy-MM-dd", new Date())
    : undefined;
  const startDate =
    rawStartDate && isValid(parsedDate) ? parsedDate : undefined;
  const startSprint =
    rawStartSprint !== "" &&
    rawStartSprint !== undefined &&
    Number(rawStartSprint) >= 0
      ? Number(rawStartSprint)
      : undefined;
  const weekdaysPerSprint =
    Number(rawWeekdaysPerSprint) > 0 ? Number(rawWeekdaysPerSprint) : undefined;

  const augmentedMd = getAugmentedMd(
    `${md}`,
    startDate,
    startSprint,
    weekdaysPerSprint
  );

  function Code(
    props: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >
  ) {
    return <code style={{ color: primaryColor }} {...props} />;
  }

  function Blockquote(
    props: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >
  ) {
    return (
      <blockquote
        style={{ backgroundColor: primaryColor, color: "#fff" }}
        {...(props as any)}
      />
    );
  }

  return (
    // @ts-expect-error Server Component
    <MDXRemote
      source={augmentedMd}
      components={{ code: Code, blockquote: Blockquote }}
    />
  );
}
