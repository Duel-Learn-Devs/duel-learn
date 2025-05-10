import React from "react";

export interface CharacterProps {
  imageSrc: string;
  alt: string;
  isRight?: boolean;
}

/**
 * Character component displays a battle character with responsive positioning
 */
const Character: React.FC<CharacterProps> = ({
  imageSrc,
  alt,
  isRight = false,
}) => (
  <div
    className={`absolute top-[60%] ${isRight
      ? "right-[15%] sm:right-[20%] lg:right-[27%] transform translate-x-1/2"
      : "left-[15%] sm:left-[20%] lg:left-[27%] transform -translate-x-1/2"
      } -translate-y-1/2 w-[220px] h-[220px] sm:w-[340px] sm:h-[340px] lg:w-[460px] lg:h-[460px]`}
  >
    <div className="w-full flex items-center justify-center">
      <img src={imageSrc} alt={alt} className="w-full h-full object-contain" />
    </div>
  </div>
);

export default Character;
