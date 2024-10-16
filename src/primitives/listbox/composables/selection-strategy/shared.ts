import { computed } from "@angular/core";
import { GetChildPropsArgs, ChildProps } from "./types";

export function getChildProps({ index, selectedIndices }: GetChildPropsArgs): ChildProps {
  return { selected: computed(() => selectedIndices().includes(index())) };
}
