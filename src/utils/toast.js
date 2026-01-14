// Toast 工具函数
export function showToast(toastRef, message) {
  if (toastRef.value) {
    toastRef.value.message = message
    toastRef.value.show()
  }
}
