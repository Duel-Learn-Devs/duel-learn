import * as React from "react";

interface ActionButtonsProps {
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * ActionButtons component displays accept and decline buttons for PvP invitations
 */
const ActionButtons: React.FC<ActionButtonsProps> = ({
  onAccept,
  onDecline,
}) => {
  return (
    <div className="flex absolute right-5 gap-2.5 max-md:relative max-md:right-0 max-md:ml-auto max-sm:gap-1.5">
      {/* Accept button */}
      <button
        onClick={onAccept}
        className="flex justify-center items-center h-[40px] bg-green-600 rounded-xl cursor-pointer w-[40px] max-md:h-[35px] max-md:w-[35px] max-sm:h-[30px] max-sm:w-[30px] hover:scale-110 transition-all duration-200 ease-in-out"
        aria-label="Accept invitation"
      >
        <div>
          <div
            dangerouslySetInnerHTML={{
              __html:
                '<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="check-icon" style="width: 24px; height: 24px"> <path d="M20.5 6L12.3284 14.1716C10.9951 15.5049 10.3284 16.1716 9.5 16.1716C8.67157 16.1716 8.00491 15.5049 6.67157 14.1716L4.5 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </svg>',
            }}
          />
        </div>
      </button>

      {/* Decline button */}
      <button
        onClick={onDecline}
        className="flex justify-center items-center h-[40px] bg-pink-800 rounded-xl cursor-pointer border-[none] w-[40px] max-md:h-[35px] max-md:w-[35px] max-sm:h-[30px] max-sm:w-[30px] hover:scale-110 transition-all duration-200 ease-in-out"
        aria-label="Decline invitation"
      >
        <div>
          <div
            dangerouslySetInnerHTML={{
              __html:
                '<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="x-icon" style="width: 24px; height: 24px"> <path d="M18.5 6L6.5 18M6.5 6L18.5 18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </svg>',
            }}
          />
        </div>
      </button>
    </div>
  );
};

export default ActionButtons;
