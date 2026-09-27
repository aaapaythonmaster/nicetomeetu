"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

type FolderComponentProps = Omit<React.ComponentProps<"div">, "color"> & {
  color?: "black" | "white" | "blue";
  size?: "sm" | "md" | "lg";
  cards?: string[];
  label?: string;
  onOpen?: () => void;
  initialOpen?: boolean;
};

const themes = {
  black: { back: "#20201f", flap: "#3a3936", stroke: "#8b877d" },
  white: { back: "#f7f1e7", flap: "#fff9ef", stroke: "#c8bca9" },
  blue: { back: "#806044", flap: "#a77e59", stroke: "#ead0a6" },
} as const;

const scales = { sm: 0.68, md: 0.84, lg: 1 } as const;
const FLAP_PATH = "M0 25C0 11.1929 11.1929 0 25 0H136.084C143.044 0 149.689 2.90139 154.42 8.00608L178.08 33.5343C182.811 38.639 189.456 41.5404 196.416 41.5404H296C309.807 41.5404 321 52.7333 321 66.5404V216C321 229.807 309.807 241 296 241H25C11.1929 241 0 229.807 0 216V25Z";

export function FolderComponent({
  color = "blue",
  size = "md",
  cards = [],
  label,
  onOpen,
  initialOpen = false,
  className,
  ...props
}: FolderComponentProps) {
  const [hovered, setHovered] = useState(false);
  const [open, setOpen] = useState(initialOpen);
  const theme = themes[color];
  const scale = scales[size];
  const cardImages = cards.slice(0, 3);

  const handleClick = () => {
    setOpen((value) => {
      const next = !value;
      if (next) onOpen?.();
      return next;
    });
  };

  return (
    <div data-slot="folder" className={cn("folder-component", className)} {...props}>
      <div
        className="folder-component__stage"
        style={{ width: 321 * scale, height: 270 * scale }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={label ? `打开${label}` : "打开文件夹"}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            handleClick();
          }
        }}
      >
        <div className="folder-component__scene" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
          <div className="folder-component__back" style={{ backgroundColor: theme.back, boxShadow: `inset 0 0 18px rgb(255 255 255 / ${color === "white" ? 0.25 : 0.16})` }} />
          <div className="folder-component__cards">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="folder-component__card"
                animate={{
                  y: open ? [-160, -180, -170][index] : hovered ? -30 - index * 8 : -10 - index * 6,
                  x: open ? [70, 0, -65][index] : [40, 3, -40][index],
                  rotate: open ? [18, -3, -14][index] : hovered ? [14, -1, -9][index] : [10, 2, -5][index],
                }}
                transition={{ type: "spring", stiffness: 120, damping: 13, delay: open ? index * 0.04 : (2 - index) * 0.03 }}
              >
                {cardImages[index] ? <Image src={cardImages[index]} alt="" fill sizes="164px" /> : <span />}
              </motion.div>
            ))}
          </div>
          <div className="folder-component__flap-anchor">
            <motion.div
              className="folder-component__flap"
              animate={{ rotateX: open ? -55 : hovered ? -45 : -15 }}
              transition={{ type: "spring", stiffness: 120, damping: 14 }}
              style={{ transformOrigin: "bottom center" }}
            >
              <div className="folder-component__flap-blur" />
              <svg width="321" height="241" viewBox="0 0 321 241" fill="none" aria-hidden="true">
                <path d={FLAP_PATH} fill={theme.flap} fillOpacity="0.76" stroke={theme.stroke} />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>
      {label ? <span className="folder-component__label">{label}</span> : null}
    </div>
  );
}

export { FolderComponent as Folder };
export type { FolderComponentProps };
