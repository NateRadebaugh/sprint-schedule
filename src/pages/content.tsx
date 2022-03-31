import { getMDXComponent } from "mdx-bundler/client";
import isValid from "date-fns/isValid";
import parse from "date-fns/parse";
import { bundleMDX } from "mdx-bundler";
import { GetServerSideProps } from "next";
import { useMemo } from "react";
import getActiveDayNumber from "../lib/getActiveDayNumber";
import getCurrentSprintNumber from "../lib/getCurrentSprintNumber";

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

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context
) => {
  const { query } = context;
  const {
    primaryColor: rawPrimaryColor,
    startDate: rawStartDate,
    startSprint: rawStartSprint,
    weekdaysPerSprint: rawWeekdaysPerSprint,
    md,
  } = query;
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

  const { code, frontmatter } = await bundleMDX({
    source: `${augmentedMd}`,
  });

  const pageProps: PageProps = { primaryColor: `${primaryColor}`, code };
  return {
    props: pageProps,
  };
};

interface PageProps {
  primaryColor: string;
  code: string;
}

export default function Page({ primaryColor, code }: PageProps) {
  const Component = useMemo(() => getMDXComponent(code), [code]);

  const Code = useMemo(
    () =>
      function Code(
        props: React.DetailedHTMLProps<
          React.HTMLAttributes<HTMLElement>,
          HTMLElement
        >
      ) {
        return <code style={{ color: primaryColor }} {...props} />;
      },
    [primaryColor]
  );

  const Blockquote = useMemo(
    () =>
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
      },
    [primaryColor]
  );

  return (
    <>
      <Component components={{ code: Code, blockquote: Blockquote }} />
    </>
  );
}
