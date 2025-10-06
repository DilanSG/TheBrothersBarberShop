// Design System constants for the application

export const colors = {
  background: {
    primary: '#1a1f3c',
    secondary: '#151a35',
    tertiary: '#111827',
    overlay: 'rgba(26, 31, 60, 0.8)'
  },
  gradient: {
    primary: 'from-red-600/50 via-blue-600/50 to-red-600/50',
    secondary: 'from-blue-300 via-blue-200 to-blue-300',
    error: 'from-red-600/50 to-red-700/50',
    success: 'from-green-600/50 to-green-700/50'
  },
  text: {
    primary: 'text-white',
    secondary: 'text-blue-300',
    muted: 'text-blue-300/80',
    error: 'text-red-200',
    success: 'text-green-200'
  },
  border: {
    primary: 'border-white/10',
    secondary: 'border-blue-500/30',
    error: 'border-red-500/30',
    success: 'border-green-500/30'
  }
};

export const effects = {
  blur: {
    background: 'backdrop-blur-xl',
    glow: 'blur-lg'
  },
  hover: {
    scale: 'hover:scale-[1.02] active:scale-[0.98]',
    glow: 'group-hover:opacity-100',
    border: 'hover:border-blue-400/50'
  },
  animation: {
    spin: 'animate-spin',
    fadeIn: 'animate-fade-in'
  }
};

export const spacing = {
  padding: {
    input: 'px-4 py-3',
    container: 'p-8 sm:p-10',
    section: 'p-6'
  },
  margin: {
    section: 'mb-8',
    element: 'mb-6'
  }
};

export const layout = {
  rounded: {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    full: 'rounded-full'
  },
  container: {
    base: 'relative overflow-hidden',
    glass: 'bg-[#1a1f3c]/80 backdrop-blur-xl border border-blue-900/30 shadow-2xl'
  }
};

export const typography = {
  heading: {
    h1: 'text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-300 via-blue-200 to-blue-300 bg-clip-text text-transparent',
    h2: 'text-2xl sm:text-3xl font-bold text-blue-200',
    h3: 'text-xl sm:text-2xl font-semibold text-blue-200'
  },
  text: {
    base: 'text-sm sm:text-base',
    small: 'text-xs sm:text-sm'
  }
};

export const input = {
  base: `
    block w-full pl-10 pr-4 py-3 
    text-white placeholder-blue-300/50 
    bg-[#151a35]/80 border border-white/10 
    rounded-xl focus:outline-none 
    focus:ring-2 focus:ring-blue-500 
    focus:border-blue-400 
    relative z-10 
    backdrop-blur-xl 
    sm:text-sm
  `,
  label: 'block text-sm font-medium text-blue-200 mb-2',
  icon: {
    wrapper: 'absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10',
    base: 'h-5 w-5 text-blue-300'
  },
  group: {
    base: 'relative group',
    glow: 'absolute inset-0 bg-gradient-to-r from-red-600/50 via-blue-600/50 to-red-600/50 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300'
  }
};
