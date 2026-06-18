import { useMemo } from 'react'

export interface GreetingProps {}

const Greeting: React.FC<GreetingProps> = () => {
  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 6) return { text: '夜深了', emoji: '🌙' }
    if (hour < 9) return { text: '早上好', emoji: '🌅' }
    if (hour < 12) return { text: '上午好', emoji: '☀️' }
    if (hour < 14) return { text: '中午好', emoji: '🌞' }
    if (hour < 18) return { text: '下午好', emoji: '🌤️' }
    if (hour < 22) return { text: '晚上好', emoji: '🌆' }
    return { text: '夜深了', emoji: '🌙' }
  }, [])

  return (
    <div className="greeting-section">
      <h1>
        {greeting.emoji} {greeting.text}，求职者！
      </h1>
      <p className="greeting-sub">
        每一次练习都在靠近梦想，今天也要加油鸭！🦆
      </p>
    </div>
  )
}

export default Greeting
