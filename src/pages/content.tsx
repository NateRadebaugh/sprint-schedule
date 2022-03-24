import { GetServerSideProps } from "next";
import { bundleMDX } from "mdx-bundler";
import React, { useMemo } from "react";
import { getMDXComponent } from "mdx-bundler/client";
import parse from "date-fns/parse";
import differenceInBusinessDays from "date-fns/differenceInBusinessDays";
import isValid from "date-fns/isValid";

function getActiveDayNumber(
  startDate: Date | undefined,
  weekdaysPerSprint: number | undefined
) {
  if (!startDate || !weekdaysPerSprint) {
    return undefined;
  }

  const daysSinceStart = differenceInBusinessDays(new Date(), startDate);
  const mod = daysSinceStart % weekdaysPerSprint;
  return mod + 1;
}

function getAugmentedMd(
  md: string,
  startDate: Date | undefined,
  weekdaysPerSprint: number | undefined
) {
  const activeDayNumber = getActiveDayNumber(startDate, weekdaysPerSprint);

  const lines = md.split("\n");
  const newLines = lines.map((line) => {
    const normalizedLine = line.replace(/[^\w:]+/gm, "").toLowerCase();
    if (
      activeDayNumber !== undefined &&
      normalizedLine.startsWith("day" + activeDayNumber + ":")
    ) {
      return ">" + line;
    }

    return line;
  });

  return newLines.join("\n");
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (
  context
) => {
  const { query } = context;
  const {
    primaryColor: rawPrimaryColor,
    startDate: rawStartDate,
    weekdaysPerSprint: rawWeekdaysPerSprint,
    md,
  } = query;
  const primaryColor = rawPrimaryColor || "#ffc107";
  const parsedDate = parse(`${rawStartDate}`, "yyyy-MM-dd", new Date());
  const startDate =
    rawStartDate && isValid(parsedDate) ? parsedDate : undefined;
  const weekdaysPerSprint =
    Number(rawWeekdaysPerSprint) > 0 ? Number(rawWeekdaysPerSprint) : undefined;

  const augmentedMd = getAugmentedMd(`${md}`, startDate, weekdaysPerSprint);

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
            {...props}
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
