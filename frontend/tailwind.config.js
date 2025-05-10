/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Nunito'],
      },
      keyframes: {
        'heartbeat-3': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.02)' },
        },
        'heartbeat-2': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        'heartbeat-1': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
        dangerPulse: {
          '0%, 100%': {
            boxShadow: '0 0 30px rgba(220, 38, 38, 0.2) inset, 0 0 50px rgba(185, 28, 28, 0.15), 0 0 75px rgba(153, 27, 27, 0.1)',
            backgroundColor: 'rgba(127, 29, 29, 0.02)'
          },
          '50%': {
            boxShadow: '0 0 50px rgba(220, 38, 38, 0.3) inset, 0 0 75px rgba(185, 28, 28, 0.25), 0 0 100px rgba(153, 27, 27, 0.2)',
            backgroundColor: 'rgba(127, 29, 29, 0.05)'
          }
        },
        'pulse-vignette': {
          '0%, 100%': { opacity: '0.7' },
          '50%': { opacity: '0.9' }
        },
        'screen-shake': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '10%': { transform: 'translate(-2px, -2px)' },
          '20%': { transform: 'translate(2px, 2px)' },
          '30%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(2px, -2px)' },
          '50%': { transform: 'translate(-1px, -1px)' },
          '60%': { transform: 'translate(1px, 1px)' },
          '70%': { transform: 'translate(-1px, 1px)' },
          '80%': { transform: 'translate(1px, -1px)' },
          '90%': { transform: 'translate(0, 0)' }
        },
        'blur-in-out': {
          '0%, 100%': { filter: 'blur(0px)' },
          '50%': { filter: 'blur(2px)' }
        },
        'health-glitch': {
          '0%, 100%': {
            opacity: '1',
            transform: 'translateX(0)'
          },
          '25%': {
            opacity: '0.8',
            transform: 'translateX(-1px)'
          },
          '50%': {
            opacity: '0.9',
            transform: 'translateX(1px)'
          },
          '75%': {
            opacity: '0.7',
            transform: 'translateX(-1px)'
          }
        },
        'waving-flag': {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
          '100%': { transform: 'translateY(0)' },
        },
        'twinkle': {
          '0%, 100%': {
            opacity: '0.3',
            transform: 'scale(0.8)'
          },
          '50%': {
            opacity: '1',
            transform: 'scale(1.2)'
          }
        },
        'float': {
          '0%': {
            transform: 'translateY(0) rotate(45deg)',
            opacity: '0.5'
          },
          '50%': {
            transform: 'translateY(-15px) rotate(45deg)',
            opacity: '0.8'
          },
          '100%': {
            transform: 'translateY(0) rotate(45deg)',
            opacity: '0.5'
          }
        },
        'spin-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      },
      animation: {
        'heartbeat-3': 'heartbeat-3 0.6s infinite',
        'heartbeat-2': 'heartbeat-2 0.4s infinite',
        'heartbeat-1': 'heartbeat-1 0.3s infinite',
        'danger-pulse': 'dangerPulse 3s ease-in-out infinite',
        'pulse-vignette': 'pulse-vignette 2s ease-in-out infinite',
        'screen-shake': 'screen-shake 0.5s ease-in-out infinite',
        'blur-in-out': 'blur-in-out 4s ease-in-out infinite',
        'health-glitch': 'health-glitch 0.3s ease-in-out infinite',
        'waving-flag': 'waving-flag 1s infinite',
        'twinkle': 'twinkle 4s ease-in-out infinite',
        'float': 'float 8s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'spin-slow': 'spin-slow 8s linear infinite'
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
}


