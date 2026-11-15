import { useAnimatedNumber } from "../../hooks/useAnimatedNumber";

export default function AnimatedNumber({ value, digits = 1 }) {
  const shown = useAnimatedNumber(value);
  if (typeof value !== "number" || Number.isNaN(value)) return <>–</>;
  return <>{shown.toFixed(digits)}</>;
}