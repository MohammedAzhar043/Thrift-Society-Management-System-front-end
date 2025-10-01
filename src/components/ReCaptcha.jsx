import { useRef } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

function ReCaptcha({ onCaptchaChange, isDisabled = false }) {
  const recaptchaRef = useRef(null);

  const handleCaptchaChange = (token) => {
    if (token) {
      onCaptchaChange(true, token);
    } else {
      onCaptchaChange(false, null);
    }
  };

  const handleExpired = () => {
    onCaptchaChange(false, null);
  };

  const handleError = () => {
    onCaptchaChange(false, null);
  };

  const resetCaptcha = () => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset();
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Security Verification
      </label>
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY || "6LeXF8IrAAAAAKqKoqlRvbi56QZ8tEWhUoyxPaPm"}
          onChange={handleCaptchaChange}
          onExpired={handleExpired}
          onError={handleError}
          disabled={isDisabled}
          theme="light"
          size="normal"
        />
      </div>
      <div className="text-center">
        <button
          type="button"
          onClick={resetCaptcha}
          disabled={isDisabled}
          className="text-sm text-blue-600 hover:text-blue-800 underline disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Reset verification
        </button>
      </div>
    </div>
  );
}

export default ReCaptcha;
