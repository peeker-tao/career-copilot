import { Link } from 'react-router-dom'
import { MessageOutlined, FileTextOutlined, CompassOutlined } from '@ant-design/icons'

export interface QuickActionsProps {}

const actions = [
  {
    icon: <MessageOutlined />,
    color: 'purple',
    title: 'AI 模拟面试',
    desc: '与 AI 面试官一对一练习',
    to: '/interview',
  },
  {
    icon: <FileTextOutlined />,
    color: 'blue',
    title: '简历管理',
    desc: '上传、查看、优化简历',
    to: '/resume',
  },
  {
    icon: <CompassOutlined />,
    color: 'green',
    title: '职业规划',
    desc: '制定专属职业发展路径',
    to: '/career-plan',
  },
]

const QuickActions: React.FC<QuickActionsProps> = () => {
  return (
    <div className="quick-actions">
      {actions.map((action) => (
        <Link key={action.to} to={action.to} className="quick-action-card">
          <div className={`qa-icon ${action.color}`}>{action.icon}</div>
          <h3>{action.title}</h3>
          <p>{action.desc}</p>
        </Link>
      ))}
    </div>
  )
}

export default QuickActions
