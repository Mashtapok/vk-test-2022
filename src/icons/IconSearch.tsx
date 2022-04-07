import React from "react";
import { Icon } from "./Icon";

type Props = {
  className?: string;
};

export const IconSearch: React.FC<Props> = ({ className }) => {
  return (
    <Icon width={56} height={56} className={className}>
      <path
        clipRule="evenodd"
        d="m25.5 9c-9.1127 0-16.5 7.3873-16.5 16.5s7.3873 16.5 16.5 16.5c4.0086 0 7.6833-1.4295 10.5422-3.8064l9.3988 9.3687c.5867.5849 1.5365.5834 2.1213-.0034.5849-.5867.5833-1.5364-.0034-2.1213l-9.3927-9.3627c2.3934-2.8635 3.8338-6.551 3.8338-10.5749 0-9.1127-7.3873-16.5-16.5-16.5zm-13.5 16.5c0-7.4558 6.0442-13.5 13.5-13.5s13.5 6.0442 13.5 13.5-6.0442 13.5-13.5 13.5-13.5-6.0442-13.5-13.5z"
        fill="currentColor"
        fillRule="evenodd"
      />
    </Icon>
  );
};
