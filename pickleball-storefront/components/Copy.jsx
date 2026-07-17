"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(SplitText, ScrollTrigger);

/**
 * Character mask reveal — reusable Copy effect.
 *
 * <Copy><h2>標題</h2></Copy>
 * <Copy animateOnScroll={false} delay={0.1}><p>內文</p></Copy>
 * <Copy active={hovered} animateOnScroll={false}><h3>Hover</h3></Copy>
 */
export default function Copy({
  children,
  animateOnScroll = true,
  active,
  delay = 0,
  stagger = 0.03,
  duration = 1,
}) {
  const containerRef = useRef(null);
  const splitRefs = useRef([]);
  const chars = useRef([]);
  const tweenRef = useRef(null);
  const readyRef = useRef(false);
  const controlled = typeof active === "boolean";

  const childText =
    React.Children.count(children) === 1 &&
    typeof children?.props?.children === "string"
      ? children.props.children
      : null;

  const playIn = () => {
    if (!chars.current.length) return;
    tweenRef.current?.kill?.();
    tweenRef.current = gsap.to(chars.current, {
      y: "0%",
      duration,
      stagger,
      ease: "power4.out",
      delay,
      overwrite: true,
    });
  };

  const playOut = () => {
    if (!chars.current.length) return;
    tweenRef.current?.kill?.();
    tweenRef.current = gsap.to(chars.current, {
      y: "100%",
      duration: Math.min(0.35, duration * 0.4),
      stagger: stagger * 0.45,
      ease: "power2.in",
      overwrite: true,
    });
  };

  useGSAP(
    () => {
      if (!containerRef.current) return;

      readyRef.current = false;
      splitRefs.current.forEach((split) => split?.revert?.());
      splitRefs.current = [];
      chars.current = [];
      tweenRef.current?.kill?.();

      const elements = containerRef.current.hasAttribute("data-copy-wrapper")
        ? Array.from(containerRef.current.children)
        : [containerRef.current];

      elements.forEach((element) => {
        const split =
          typeof SplitText.create === "function"
            ? SplitText.create(element, {
                type: "chars",
                mask: "chars",
                charsClass: "char++",
              })
            : new SplitText(element, {
                type: "chars",
                mask: "chars",
                charsClass: "char++",
              });

        splitRefs.current.push(split);
        chars.current.push(...split.chars);
      });

      gsap.set(chars.current, { y: "100%" });
      readyRef.current = true;

      if (!controlled) {
        if (animateOnScroll) {
          tweenRef.current = gsap.to(chars.current, {
            y: "0%",
            duration,
            stagger,
            ease: "power4.out",
            delay,
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 75%",
              once: true,
            },
          });
        } else {
          playIn();
        }
      } else if (active) {
        playIn();
      }

      return () => {
        readyRef.current = false;
        tweenRef.current?.kill?.();
        splitRefs.current.forEach((split) => split?.revert?.());
        splitRefs.current = [];
        chars.current = [];
      };
    },
    {
      scope: containerRef,
      dependencies: [
        animateOnScroll,
        delay,
        stagger,
        duration,
        controlled,
        childText,
      ],
    }
  );

  useEffect(() => {
    if (!controlled || !readyRef.current) return;
    if (active) playIn();
    else playOut();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, controlled, delay, stagger, duration]);

  if (React.Children.count(children) === 1) {
    return React.cloneElement(children, { ref: containerRef });
  }

  return (
    <div ref={containerRef} data-copy-wrapper="true">
      {children}
    </div>
  );
}
