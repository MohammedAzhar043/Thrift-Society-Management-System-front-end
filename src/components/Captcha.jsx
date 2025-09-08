import { useState, useEffect } from 'react';
import { FaRedo } from 'react-icons/fa';

function Captcha({ onCaptchaChange, isDisabled = false }) {
  const [captchaValue, setCaptchaValue] = useState('');
  const [captchaProblem, setCaptchaProblem] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState(0);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const operators = ['+', '-', '×'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    let answer;
    let problem;
    
    switch (operator) {
      case '+':
        answer = num1 + num2;
        problem = `${num1} + ${num2}`;
        break;
      case '-':
        answer = num1 - num2;
        problem = `${num1} - ${num2}`;
        break;
      case '×':
        answer = num1 * num2;
        problem = `${num1} × ${num2}`;
        break;
      default:
        answer = num1 + num2;
        problem = `${num1} + ${num2}`;
    }
    
    setCaptchaProblem(problem);
    setCaptchaAnswer(answer);
    setCaptchaValue('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleRefresh = () => {
    generateCaptcha();
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setCaptchaValue(value);
    
    // Check if the answer is correct and notify parent component
    if (parseInt(value) === captchaAnswer) {
      onCaptchaChange(true, value);
    } else {
      onCaptchaChange(false, value);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Security Verification
      </label>
      <div className="flex items-center space-x-3">
        <div className="flex-1 bg-gray-50 border border-gray-300 rounded-md px-3 py-2 text-center font-mono text-lg">
          {captchaProblem} = ?
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isDisabled}
          className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md disabled:opacity-50"
          title="Refresh captcha"
        >
          <FaRedo className="h-4 w-4" />
        </button>
      </div>
      <input
        type="number"
        value={captchaValue}
        onChange={handleInputChange}
        disabled={isDisabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
        placeholder="Enter your answer"
        required
      />
    </div>
  );
}

export default Captcha;
