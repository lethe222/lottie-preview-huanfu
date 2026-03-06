import requests
import json
import sys
import os
import time

# 配置信息 (请根据实际情况修改或从环境变量获取)
APP_ID = "cli_a92c70d69d389bc6"
APP_SECRET = "P2QROpWY7nPrNp1XlH3qZbQifMqdKABR"

class FeishuDocSync:
    def __init__(self, app_id, app_secret):
        self.app_id = app_id
        self.app_secret = app_secret
        self.token = None
        self.refresh_token()

    def refresh_token(self):
        url = "https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal"
        headers = {"Content-Type": "application/json; charset=utf-8"}
        payload = {"app_id": self.app_id, "app_secret": self.app_secret}
        try:
            response = requests.post(url, headers=headers, json=payload)
            if response.status_code == 200:
                self.token = response.json().get("tenant_access_token")
            else:
                print(f"获取 Token 失败: {response.text}")
        except Exception as e:
            print(f"Token 请求错误: {e}")

    def get_headers(self):
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json; charset=utf-8"
        }

    def get_blocks(self, document_id):
        """获取文档所有 Block"""
        url = f"https://open.feishu.cn/open-apis/docx/v1/documents/{document_id}/blocks"
        params = {"page_size": 500}
        all_blocks = []
        page_token = None

        print(f"📥 正在读取文档: {document_id}")
        while True:
            if page_token:
                params["page_token"] = page_token
            
            resp = requests.get(url, headers=self.get_headers(), params=params)
            if resp.status_code != 200:
                print(f"❌ 读取失败: {resp.text}")
                break
            
            data = resp.json()
            if data.get("code") != 0:
                print(f"❌ API 错误: {data.get('msg')}")
                break

            items = data.get("data", {}).get("items", [])
            all_blocks.extend(items)
            
            page_token = data.get("data", {}).get("page_token")
            if not page_token:
                break
        
        print(f"✅ 读取完成，共 {len(all_blocks)} 个 Block")
        return all_blocks

    def clear_document(self, document_id, root_block_id):
        """清空文档内容 (删除 Root 下的所有子节点)"""
        # 获取 Root Block 的子节点
        url = f"https://open.feishu.cn/open-apis/docx/v1/documents/{document_id}/blocks/{root_block_id}/children"
        resp = requests.get(url, headers=self.get_headers())
        if resp.status_code != 200:
            return
        
        children = resp.json().get("data", {}).get("items", [])
        if not children:
            print("ℹ️ 文档为空，无需清理")
            return

        child_ids = [child["block_id"] for child in children]
        
        # 批量删除
        print(f"🗑️ 正在清空文档 {document_id}...")
        del_url = f"https://open.feishu.cn/open-apis/docx/v1/documents/{document_id}/blocks/batch_delete"
        
        # 每次最多删除 50 个
        batch_size = 50
        for i in range(0, len(child_ids), batch_size):
            batch = child_ids[i:i+batch_size]
            payload = {"block_ids": batch}
            requests.delete(del_url, headers=self.get_headers(), json=payload)

    def transform_block_for_create(self, block):
        """将原始 Block 转换为创建时所需的 payload 格式"""
        block_type = block.get("block_type")
        
        # 映射不同类型的 Block 内容
        type_mapping = {
            2: "text", 3: "heading1", 4: "heading2", 5: "heading3",
            6: "heading4", 7: "heading5", 8: "heading6", 9: "heading7",
            10: "heading8", 11: "heading9", 12: "bullet", 13: "ordered",
            14: "code", 15: "quote", 27: "image", 31: "table"
        }
        
        type_name = type_mapping.get(block_type)
        if not type_name:
            return None # 不支持的类型跳过
            
        payload = {"block_type": block_type}
        block_data = block.get(type_name, {})
        
        # 构建新的 block data
        new_data = {}
        
        # 处理文本元素
        if "elements" in block_data:
            new_data["elements"] = block_data["elements"]
            
        # 处理样式
        if "style" in block_data:
            new_data["style"] = block_data["style"]
            
        # 特殊处理图片
        if block_type == 27:
            token = block_data.get("token")
            # 注意：直接使用原 Token 可能因为权限问题失效
            # 理想做法是：下载原图 -> 上传到新文档 -> 获取新 Token
            # 这里简化处理：直接尝试复用 Token
            new_data["token"] = token
            if "width" in block_data: new_data["width"] = block_data["width"]
            if "height" in block_data: new_data["height"] = block_data["height"]

        # 组装
        payload[type_name] = new_data
        return payload

    def sync_doc(self, source_id, dest_id):
        """同步文档内容"""
        # 1. 获取源文档 Blocks
        blocks = self.get_blocks(source_id)
        if not blocks:
            print("❌ 源文档为空或无法读取")
            return

        # 2. 获取目标文档信息 (找到 Root Block ID)
        dest_meta = self.get_blocks(dest_id)
        if not dest_meta:
            print("❌ 目标文档无法访问")
            return
        
        dest_root_id = None
        for b in dest_meta:
            if b["block_type"] == 1: # Page
                dest_root_id = b["block_id"]
                break
        
        if not dest_root_id:
            dest_root_id = dest_meta[0]["block_id"] # Fallback

        # 3. 清空目标文档
        self.clear_document(dest_id, dest_root_id)

        # 4. 重建 Blocks
        print(f"🚀 开始写入目标文档: {dest_id}")
        
        # 建立 Block 树结构
        children_map = {} # parent_id -> [child_blocks]
        
        for b in blocks:
            parent_id = b.get("parent_id")
            if parent_id:
                if parent_id not in children_map:
                    children_map[parent_id] = []
                children_map[parent_id].append(b)
        
        # 源文档 Root ID
        source_root_id = None
        for b in blocks:
            if b["block_type"] == 1:
                source_root_id = b["block_id"]
                break
        
        if not source_root_id:
            print("❌ 无法找到源文档 Root")
            return

        top_level_blocks = children_map.get(source_root_id, [])
        
        # 递归构建 Payload
        def build_payload(block):
            payload = self.transform_block_for_create(block)
            if not payload:
                return None
                
            # 检查是否有子节点
            child_blocks = children_map.get(block["block_id"], [])
            if child_blocks:
                payload["children"] = []
                for child in child_blocks:
                    child_payload = build_payload(child)
                    if child_payload:
                        payload["children"].append(child_payload)
            
            return payload

        # 转换所有顶层 Block
        create_payloads = []
        for b in top_level_blocks:
            p = build_payload(b)
            if p:
                create_payloads.append(p)
        
        if not create_payloads:
            print("⚠️ 没有可写入的内容")
            return

        # 批量写入
        url = f"https://open.feishu.cn/open-apis/docx/v1/documents/{dest_id}/blocks/{dest_root_id}/children"
        
        # 分批写入
        batch_size = 20
        for i in range(0, len(create_payloads), batch_size):
            batch = create_payloads[i:i+batch_size]
            body = {"children": batch}
            
            resp = requests.post(url, headers=self.get_headers(), json=body)
            if resp.status_code != 200:
                print(f"⚠️ 写入部分失败: {resp.text}")
            else:
                print(f"✅ 成功写入第 {i//batch_size + 1} 批数据")
                
        print("🎉 同步完成！")

def main():
    if len(sys.argv) < 3:
        print("Usage: python3 sync_feishu_doc.py <source_doc_id> <dest_doc_id>")
        print("Example: python3 sync_feishu_doc.py Hga6d1hTIogBnqxthnNcPrEUnfc dwnc...xyz")
        return

    source_id = sys.argv[1]
    dest_id = sys.argv[2]
    
    syncer = FeishuDocSync(APP_ID, APP_SECRET)
    syncer.sync_doc(source_id, dest_id)

if __name__ == "__main__":
    main()
