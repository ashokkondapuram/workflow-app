import httpx
from datetime import datetime, timezone
from app.models import WorkflowDefinition, ExecutionLog


async def execute_workflow(workflow: WorkflowDefinition) -> list[ExecutionLog]:
    logs: list[ExecutionLog] = []
    node_map = {n.id: n for n in workflow.nodes}
    edge_map: dict[str, list[str]] = {}

    for edge in workflow.edges:
        edge_map.setdefault(edge.source, []).append(edge.target)

    targets = {e.target for e in workflow.edges}
    start_nodes = [n for n in workflow.nodes if n.id not in targets]
    if not start_nodes:
        start_nodes = [workflow.nodes[0]]

    visited = set()
    queue = [start_nodes[0].id]

    async with httpx.AsyncClient(timeout=10) as client:
        while queue:
            node_id = queue.pop(0)
            if node_id in visited:
                continue
            visited.add(node_id)
            node = node_map.get(node_id)
            if not node:
                continue
            log = await execute_node(node, client)
            logs.append(log)
            if log.status != "error":
                for next_id in edge_map.get(node_id, []):
                    queue.append(next_id)

    return logs


async def execute_node(node, client: httpx.AsyncClient) -> ExecutionLog:
    ts = datetime.now(timezone.utc).isoformat()
    cfg = node.data.config

    try:
        if node.data.type == "trigger":
            return ExecutionLog(node_id=node.id, status="success",
                output=f"Trigger fired on {cfg.get('method','POST')} {cfg.get('path','/webhook')}",
                timestamp=ts)

        elif node.data.type == "action":
            url = cfg.get("url", "")
            if not url:
                return ExecutionLog(node_id=node.id, status="skipped", output="No URL configured", timestamp=ts)
            resp = await client.request(cfg.get("method", "GET"), url)
            return ExecutionLog(node_id=node.id, status="success",
                output=f"HTTP {resp.status_code} from {url}", timestamp=ts)

        elif node.data.type == "condition":
            field = cfg.get("field", "")
            op = cfg.get("operator", "equals")
            value = cfg.get("value", "")
            return ExecutionLog(node_id=node.id, status="success",
                output=f"Condition: {field} {op} {value} evaluated", timestamp=ts)

        elif node.data.type == "delay":
            import asyncio
            secs = float(cfg.get("duration", "1"))
            unit = cfg.get("unit", "seconds")
            wait = secs if unit == "seconds" else secs * 60
            await asyncio.sleep(min(wait, 5))
            return ExecutionLog(node_id=node.id, status="success",
                output=f"Waited {secs} {unit}", timestamp=ts)

        elif node.data.type == "webhook":
            url = cfg.get("url", "")
            if not url:
                return ExecutionLog(node_id=node.id, status="skipped", output="No webhook URL", timestamp=ts)
            body = cfg.get("body", "{}")
            resp = await client.post(url, content=body, headers={"Content-Type": "application/json"})
            return ExecutionLog(node_id=node.id, status="success",
                output=f"Webhook sent {resp.status_code}", timestamp=ts)

        else:
            return ExecutionLog(node_id=node.id, status="skipped",
                output=f"Unknown type: {node.data.type}", timestamp=ts)

    except Exception as e:
        return ExecutionLog(node_id=node.id, status="error", output=str(e), timestamp=ts)
