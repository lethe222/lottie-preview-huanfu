import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

// 模拟浏览器环境中的 lottie-web
import lottie from 'lottie-web'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 异步测试函数
async function testAnimation() {
  try {
    // 读取测试动画文件
    const animationPath = path.join(__dirname, 'test', '春节背景大卡.json')
    const animationContent = await fs.readFile(animationPath, 'utf8')
    const animationData = JSON.parse(animationContent)

    console.log('动画文件加载成功，开始分析动画数据...')
    console.log('动画版本:', animationData.v)
    console.log('帧率:', animationData.fr)
    console.log('尺寸:', animationData.w, 'x', animationData.h)
    console.log('总帧数:', animationData.op - animationData.ip)
    console.log('资源数量:', animationData.assets ? animationData.assets.length : 0)

    // 检查资源是否包含 data:image 格式的图片
    if (animationData.assets) {
      console.log('\n资源详情:')
      animationData.assets.forEach((asset, index) => {
        if (asset.p && asset.p.startsWith('data:image')) {
          console.log(
            `资源 ${index} (${asset.id}): 包含 base64 图片，大小约 ${(asset.p.length / 1024).toFixed(2)} KB`,
          )
        } else {
          console.log(`资源 ${index} (${asset.id}): ${asset.p || '无图片数据'}`)
        }
      })
    }

    // 尝试模拟加载动画
    console.log('\n尝试模拟加载动画...')

    // 创建一个模拟的容器对象
    const mockContainer = {
      innerHTML: '',
      querySelector: function (selector) {
        return this.innerHTML.includes('<svg') ? { cloneNode: () => ({}) } : null
      },
    }

    // 尝试加载动画
    const animation = lottie.loadAnimation({
      container: mockContainer,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      animationData: animationData,
    })

    console.log('动画加载成功！')
    console.log('动画实例:', animation)
    console.log('总帧数:', animation.totalFrames)

    // 销毁动画实例
    animation.destroy()
    console.log('动画实例销毁成功')

    console.log('\n测试完成！')
  } catch (error) {
    console.error('动画加载失败:', error.message)
    console.error('错误堆栈:', error.stack)
  }
}

// 运行测试
testAnimation()
