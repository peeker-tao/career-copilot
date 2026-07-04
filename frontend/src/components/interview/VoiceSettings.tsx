import { useEffect } from 'react'
import { ConfigProvider, Modal, Radio, Skeleton, Space, Typography } from 'antd'
import { SoundOutlined } from '@ant-design/icons'
import { useVoiceStore } from '@/store/useVoiceStore'
import { VOICE_DISPLAY_NAMES } from '@/api/voice'

const { Text } = Typography

export interface VoiceSettingsProps {
  open: boolean
  onClose: () => void
}

/**
 * VoiceSettings - 面试语音音色设置弹窗
 * 允许用户选择 TTS 朗读音色
 */
export default function VoiceSettings({ open, onClose }: VoiceSettingsProps) {
  const voiceList = useVoiceStore((s) => s.voiceList)
  const voiceListLoading = useVoiceStore((s) => s.voiceListLoading)
  const voiceListFetched = useVoiceStore((s) => s.voiceListFetched)
  const currentVoice = useVoiceStore((s) => s.settings.voice)
  const setVoice = useVoiceStore((s) => s.setVoice)
  const fetchVoiceList = useVoiceStore((s) => s.fetchVoiceList)

  useEffect(() => {
    if (open && !voiceListFetched && !voiceListLoading) {
      fetchVoiceList()
    }
  }, [open, voiceListFetched, voiceListLoading, fetchVoiceList])

  const handleSelect = (voice: string) => {
    setVoice(voice)
    onClose()
  }

  return (
    <Modal
      title={
        <Space>
          <SoundOutlined />
          <span>语音音色设置</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={420}
      destroyOnHidden
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
        选择 AI 面试官朗读使用的语音音色
      </Text>

      {voiceListLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : voiceList.length === 0 ? (
        <Text type="secondary">暂无可用语音</Text>
      ) : (
        <ConfigProvider theme={{ token: { colorPrimary: '#7c3aed' } }}>
        <Radio.Group
          value={currentVoice}
          onChange={(e) => handleSelect(e.target.value)}
          className="voice-settings-radio-group"
        >
          <Space orientation="vertical" className="voice-settings-space" size={8}>
            {(voiceList || []).map((voice) => (
              <div
                key={voice}
                className={`voice-settings-item-card ${currentVoice === voice ? 'active' : ''}`}
                onClick={() => handleSelect(voice)}
              >
                <div className="voice-settings-item-info">
                  <Text strong style={{ fontSize: 14 }}>
                    {VOICE_DISPLAY_NAMES[voice] || voice}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {voice}
                  </Text>
                </div>
                <Radio value={voice} />
              </div>
            ))}
          </Space>
        </Radio.Group>
        </ConfigProvider>
      )}
    </Modal>
  )
}
