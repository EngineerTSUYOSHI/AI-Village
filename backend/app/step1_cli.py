import time
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from app.agent import Agent
from app.brain import AgentBrain
from app.config import check_api_key, GEMINI_MODEL
from app.models import AgentProfile, PerceptionContext

console = Console()


def create_sample_agents(brain: AgentBrain):
    """Step 1検証用のアリスとボブのエージェントを生成する"""
    alice_profile = AgentProfile(
        name="アリス",
        role="パン屋見習いの少女",
        personality="明るく好奇心旺盛。少しおっちょこちょい。新作パンのアイデアをいつも考えている。",
        goal="森に生えているという伝説の香り草（ムーンハーブ）を見つけて、特別なパンを焼きたい。"
    )

    bob_profile = AgentProfile(
        name="ボブ",
        role="森の薬草師",
        personality="物静かで観察眼が鋭い。植物やハーブに詳しいが、少し人見知り。",
        goal="朝摘んだハーブを村の広場で乾かしながら、ハーブの良さを誰かに伝えたい。"
    )

    alice = Agent(profile=alice_profile, brain=brain)
    bob = Agent(profile=bob_profile, brain=brain)

    return alice, bob


def display_agent_card(profile: AgentProfile, color: str):
    """エージェントの紹介カードを表示"""
    content = f"[bold]役割:[/bold] {profile.role}\n" \
              f"[bold]性格:[/bold] {profile.personality}\n" \
              f"[bold]現在の目標:[/bold] [yellow]{profile.goal}[/yellow]"
    console.print(Panel(content, title=f"[{color} bold]👤 {profile.name}[/{color} bold]", border_style=color))


def display_turn(speaker_name: str, color: str, thought: str, dialogue: str, action: str, turn: int):
    """1ターンの発言・思考をリッチなパネルで表示"""
    body = (
        f"[dim italic]💭 心の声: {thought}[/dim italic]\n\n"
        f"[bold]💬 発言:[/bold] 「{dialogue or '（沈黙）'}」\n"
        f"[cyan]🎬 仕草/行動:[/cyan] {action}"
    )
    console.print(
        Panel(
            body,
            title=f"[{color} bold]Turn {turn} - {speaker_name}[/{color} bold]",
            border_style=color,
            subtitle=f"[dim]{action}[/dim]"
        )
    )


def run_step1_simulation(max_turns: int = 4):
    """Step 1: 2体のエージェントによるテキスト対話ループを実行"""
    console.print()
    console.print(
        Panel.fit(
            "[bold yellow]🏰 自律型AIエージェント仮想村シミュレーション[/bold yellow]\n"
            "[green]Step 1: 【頭脳コア】2体のエージェントによるテキスト対話ループ検証[/green]",
            border_style="bright_blue"
        )
    )

    # APIキー確認
    has_key = check_api_key()
    if has_key:
        console.print(f"[bold green]✔ Gemini API Key が設定されています（モデル: {GEMINI_MODEL}）[/bold green]")
    else:
        console.print("[bold yellow]⚠ GEMINI_API_KEY が未設定または初期値のため、モックモードで動作します。[/bold yellow]")
        console.print("[dim]※ 実際のAI対話を試すには backend/.env に有効な GEMINI_API_KEY を記述してください。[/dim]")

    console.print()

    # エージェント初期化
    brain = AgentBrain()
    alice, bob = create_sample_agents(brain)

    # エージェント情報表示
    display_agent_card(alice.profile, "magenta")
    display_agent_card(bob.profile, "cyan")
    console.print()

    console.print("[bold green]=== シミュレーション開始: 村の広場の噴水前 ===[/bold green]")
    console.print("[dim]状況: アリスがパンの材料を探して広場を歩いていると、ハーブの束を抱えたボブと鉢合わせました。[/dim]\n")

    current_speaker = alice
    listener = bob
    speaker_color = "magenta"
    listener_color = "cyan"

    # 初期シチュエーション
    last_message = None
    situation = "広場の噴水前で偶然すれ違い、目が合いました。"

    for turn in range(1, max_turns + 1):
        # 話者の知覚コンテキスト
        context = PerceptionContext(
            location="村の広場・噴水前",
            target_name=listener.profile.name,
            incoming_message=last_message,
            situation=situation
        )

        with console.status(f"[bold {speaker_color}]{current_speaker.profile.name} が思考中...[/]"):
            decision = current_speaker.react(context)

        # 思考・発言の表示
        display_turn(
            speaker_name=current_speaker.profile.name,
            color=speaker_color,
            thought=decision.inner_thought,
            dialogue=decision.dialogue or "",
            action=decision.action,
            turn=turn
        )

        # 次のターンの準備
        last_message = decision.dialogue
        situation = f"{current_speaker.profile.name}が『{decision.dialogue}』と言い、{decision.action}。"

        # 交代
        current_speaker, listener = listener, current_speaker
        speaker_color, listener_color = listener_color, speaker_color

        time.sleep(1)

    console.print("\n[bold green]=== シミュレーション終了 ===[/bold green]\n")

    # 蓄積された記憶の確認
    table = Table(title="🧠 形成された記憶ストリーム (Memory Stream)")
    table.add_column("エージェント", style="bold")
    table.add_column("種別", style="dim")
    table.add_column("記憶内容")

    for m in alice.memories:
        table.add_row("[magenta]アリス[/magenta]", m.kind, m.content)
    table.add_section()
    for m in bob.memories:
        table.add_row("[cyan]ボブ[/cyan]", m.kind, m.content)

    console.print(table)
    console.print()


if __name__ == "__main__":
    run_step1_simulation()
