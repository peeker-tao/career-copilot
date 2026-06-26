import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeftOutlined } from '@ant-design/icons'

interface PageHeaderProps {
  title: string
  subtitle?: string
  backTo?: string
  backLabel?: string
  extra?: ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  backTo,
  backLabel = '返回',
  extra,
}: PageHeaderProps) {
  return (
    <>
      {backTo && (
        <Link to={backTo} className="back-link inline-block mb-12">
          <ArrowLeftOutlined /> {backLabel}
        </Link>
      )}
      <div className="page-header flex justify-between" style={{ alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">{title}</h1>
          {subtitle && <p className="page-desc">{subtitle}</p>}
        </div>
        {extra && <div className="page-header-extra">{extra}</div>}
      </div>
    </>
  )
}
