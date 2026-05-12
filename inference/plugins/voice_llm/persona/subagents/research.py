from __future__ import annotations

import os
from typing import Any, Protocol, TypedDict

from inference.plugins.voice_llm.persona.i18n import Localizer, locale_from_metadata, normalize_locale
from inference.plugins.voice_llm.persona.llm import AgentLLM, build_agent_llm
from inference.plugins.voice_llm.persona.schemas import ArtifactRequest, Task, TaskEvent
from inference.plugins.voice_llm.persona.tools import SearchResult, SearchTool


class TaskCallbacks(Protocol):
    async def event(self, task_id: str, event: TaskEvent) -> None:
        ...

    async def artifact(self, task_id: str, artifact: ArtifactRequest) -> dict[str, Any]:
        ...


class ResearchState(TypedDict, total=False):
    task_id: str
    query: str
    kind: str
    plan: list[str]
    results: list[dict[str, str]]
    normalized_request: str
    artifact_title: str
    artifact_content: str
    artifact_id: str | None
    summary: str


def _result_dict(result: SearchResult) -> dict[str, str]:
    return {"title": result.title, "url": result.url, "snippet": result.snippet}


def _localizer_for_task(task: Task) -> Localizer:
    if task.locale:
        return Localizer(normalize_locale(task.locale))
    return Localizer(locale_from_metadata(task.metadata))


async def _compile_graph(
    task: Task,
    search_tool: SearchTool,
    llm: AgentLLM,
    callbacks: TaskCallbacks,
    checkpoint_db_path: str | None = None,
):
    from langgraph.graph import END, START, StateGraph

    graph = StateGraph(ResearchState)

    async def classify_task(state: ResearchState) -> ResearchState:
        localizer = _localizer_for_task(task)
        classification = await llm.classify_task(task, localizer)
        return {
            "kind": str(classification.get("kind") or task.kind or "research").strip() or "research",
            "normalized_request": str(classification.get("normalized_request") or task.user_request).strip()
            or task.user_request,
        }

    async def plan_task(state: ResearchState) -> ResearchState:
        localizer = _localizer_for_task(task)
        plan_steps = await llm.plan_task(task, localizer)
        if not plan_steps:
            plan_steps = localizer.list("plan.steps")
        await callbacks.event(
            task.id,
            TaskEvent(
                event_type="plan.created",
                status="running",
                message=localizer.text("event.plan_created", steps_text=localizer.text("list.joiner").join(plan_steps)),
                progress=15,
                payload={
                    "steps": plan_steps,
                    "locale": localizer.locale,
                    "llm_provider": llm.provider,
                    "llm_model": llm.model,
                },
            ),
        )
        return {"plan": plan_steps}

    async def run_research(state: ResearchState) -> ResearchState:
        localizer = _localizer_for_task(task)
        query = str(state.get("normalized_request") or task.user_request).strip() or task.user_request
        results = await search_tool.search(query, limit=5)
        result_dicts = [_result_dict(result) for result in results]
        if not result_dicts:
            await callbacks.event(
                task.id,
                TaskEvent(
                    event_type="research.blocked",
                    status="running",
                    message=localizer.text("event.research_blocked"),
                    progress=45,
                ),
            )
        return {"results": result_dicts}

    async def draft_artifact(state: ResearchState) -> ResearchState:
        localizer = _localizer_for_task(task)
        result_dicts = state.get("results", [])
        draft = await llm.draft_artifact(task, result_dicts, localizer)
        artifact = await callbacks.artifact(
            task.id,
            ArtifactRequest(
                title=draft.title,
                content=draft.content_markdown,
                metadata={
                    "source_count": len(result_dicts),
                    "task_kind": task.kind,
                    "locale": localizer.locale,
                    "llm_provider": llm.provider,
                    "llm_model": llm.model,
                },
            ),
        )
        artifact_id = artifact.get("id") if isinstance(artifact, dict) else None
        return {
            "artifact_title": draft.title,
            "artifact_content": draft.content_markdown,
            "artifact_id": artifact_id,
            "summary": draft.summary,
        }

    async def finalize(state: ResearchState) -> ResearchState:
        localizer = _localizer_for_task(task)
        summary = str(state.get("summary") or "").strip() or localizer.text("event.completed")
        await callbacks.event(
            task.id,
            TaskEvent(
                event_type="task.completed",
                status="completed",
                message=summary,
                progress=100,
                payload={"artifact_id": state.get("artifact_id")},
            ),
        )
        return {"summary": summary}

    graph.add_node("classify_task", classify_task)
    graph.add_node("plan_task", plan_task)
    graph.add_node("run_research", run_research)
    graph.add_node("draft_artifact", draft_artifact)
    graph.add_node("finalize", finalize)
    graph.add_edge(START, "classify_task")
    graph.add_edge("classify_task", "plan_task")
    graph.add_edge("plan_task", "run_research")
    graph.add_edge("run_research", "draft_artifact")
    graph.add_edge("draft_artifact", "finalize")
    graph.add_edge("finalize", END)

    checkpointer = None
    checkpoint_conn = None
    if checkpoint_db_path:
        try:
            import aiosqlite
            from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver

            if checkpoint_db_path != ":memory:":
                os.makedirs(os.path.dirname(os.path.abspath(checkpoint_db_path)), exist_ok=True)
            checkpoint_conn = await aiosqlite.connect(checkpoint_db_path)
            checkpointer = AsyncSqliteSaver(checkpoint_conn)
            await checkpointer.setup()
        except Exception:
            checkpointer = None
            if checkpoint_conn is not None:
                await checkpoint_conn.close()
                checkpoint_conn = None
    if checkpointer is None:
        return graph.compile(), None
    return graph.compile(checkpointer=checkpointer), checkpoint_conn


async def _run_task_sequential(
    task: Task,
    search_tool: SearchTool,
    callbacks: TaskCallbacks,
    llm: AgentLLM,
) -> None:
    localizer = _localizer_for_task(task)
    classification = await llm.classify_task(task, localizer)
    normalized_request = str(classification.get("normalized_request") or task.user_request).strip() or task.user_request

    plan_steps = await llm.plan_task(task, localizer)
    if not plan_steps:
        plan_steps = localizer.list("plan.steps")
    await callbacks.event(
        task.id,
        TaskEvent(
            event_type="plan.created",
            status="running",
            message=localizer.text("event.plan_created", steps_text=localizer.text("list.joiner").join(plan_steps)),
            progress=15,
            payload={
                "steps": plan_steps,
                "locale": localizer.locale,
                "llm_provider": llm.provider,
                "llm_model": llm.model,
            },
        ),
    )

    results = await search_tool.search(normalized_request, limit=5)
    result_dicts = [_result_dict(result) for result in results]
    if not result_dicts:
        await callbacks.event(
            task.id,
            TaskEvent(
                event_type="research.blocked",
                status="running",
                message=localizer.text("event.research_blocked"),
                progress=45,
            ),
        )

    draft = await llm.draft_artifact(task, result_dicts, localizer)
    artifact = await callbacks.artifact(
        task.id,
        ArtifactRequest(
            title=draft.title,
            content=draft.content_markdown,
            metadata={
                "source_count": len(result_dicts),
                "task_kind": task.kind,
                "locale": localizer.locale,
                "llm_provider": llm.provider,
                "llm_model": llm.model,
            },
        ),
    )
    artifact_id = artifact.get("id") if isinstance(artifact, dict) else None
    await callbacks.event(
        task.id,
        TaskEvent(
            event_type="task.completed",
            status="completed",
            message=draft.summary or localizer.text("event.completed"),
            progress=100,
            payload={"artifact_id": artifact_id},
        ),
    )


async def run_task_with_langgraph(
    task: Task,
    search_tool: SearchTool,
    callbacks: TaskCallbacks,
    llm: AgentLLM | None = None,
) -> None:
    checkpoint_db_path = os.getenv("LANGGRAPH_CHECKPOINT_DB") or os.path.join(
        os.getenv("CYBERVERSE_CONFIG_DIR", "."),
        "data",
        "tasks",
        "langgraph_checkpoints.db",
    )
    agent_llm = llm or build_agent_llm()
    try:
        graph, checkpoint_conn = await _compile_graph(task, search_tool, agent_llm, callbacks, checkpoint_db_path)
    except ModuleNotFoundError:
        await _run_task_sequential(task, search_tool, callbacks, agent_llm)
        return
    initial_state: ResearchState = {
        "task_id": task.id,
        "query": task.user_request,
        "kind": task.kind,
    }
    try:
        await graph.ainvoke(initial_state, config={"configurable": {"thread_id": task.id}})
    finally:
        if checkpoint_conn is not None:
            await checkpoint_conn.close()


def _draft_markdown(task: Task, results: list[dict[str, str]], localizer: Localizer) -> str:
    lines: list[str] = [
        f"# {task.title}",
        "",
        f"{localizer.text('artifact.user_request')}{localizer.text('artifact.label_separator')}{task.user_request}",
        "",
        f"## {localizer.text('artifact.current_status')}",
    ]
    if not results:
        lines.extend(
            [
                localizer.text("artifact.null_search_line_1"),
                localizer.text("artifact.null_search_line_2"),
            ]
        )
    else:
        lines.append(localizer.text("artifact.results_intro"))
        for index, result in enumerate(results, start=1):
            lines.extend(
                [
                    "",
                    f"### {index}. {result['title']}",
                    result["snippet"],
                    result["url"],
                ]
            )
    return "\n".join(lines).strip() + "\n"
