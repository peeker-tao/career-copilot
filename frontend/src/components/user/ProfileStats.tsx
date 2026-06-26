import { MessageOutlined, EditOutlined, FileTextOutlined, CompassOutlined } from '@ant-design/icons'

export interface ProfileStatsData {
  totalInterviews: number
  avgScore: number
  resumeCount: number
  activePlans: number
}

export interface ProfileStatsProps {
  stats: ProfileStatsData
}

const ProfileStats: React.FC<ProfileStatsProps> = ({ stats }) => {
  const items = [
    { icon: <MessageOutlined />, label: '面试次数', value: stats.totalInterviews, color: '#1890ff' },
    { icon: <EditOutlined />, label: '平均评分', value: stats.avgScore, suffix: '分', color: '#52c41a' },
    { icon: <FileTextOutlined />, label: '简历数量', value: stats.resumeCount, color: '#7c3aed' },
    { icon: <CompassOutlined />, label: '进行中规划', value: stats.activePlans, color: '#fa8c16' },
  ]

  return (
    <div className="profile-stats">
      {items.map((item) => (
        <div key={item.label} className="profile-stat-card">
          <div className="profile-stat-icon" style={{ background: `${item.color}15`, color: item.color }}>
            {item.icon}
          </div>
          <div className="profile-stat-info">
            <div className="profile-stat-value">
              {item.value}
              {item.suffix ?? ''}
            </div>
            <div className="profile-stat-label">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ProfileStats
