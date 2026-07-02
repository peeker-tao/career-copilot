import { useMemo } from 'react'

export interface GreetingProps {}

const Greeting: React.FC<GreetingProps> = () => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 6) return '夜深了'
    if (hour < 9) return '早上好'
    if (hour < 12) return '上午好'
    if (hour < 14) return '中午好'
    if (hour < 18) return '下午好'
    if (hour < 22) return '晚上好'
    return '夜深了'
  }, [])

  return (
    <div className="greeting-section">
      <h1>
        {greeting}，求职者！
      </h1>
      <p className="greeting-sub">
        每一次练习都在靠近梦想，今天也要加油！
      </p>
    </div>
  )
}

export default Greeting
