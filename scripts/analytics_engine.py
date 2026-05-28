# -*- coding: utf-8 -*-
"""
EduTrack AI — Motor Analítico & Gerador de Relatórios PDF
=========================================================
Modos de operação:
  1. Batch (padrão):  python analytics_engine.py
     → Lê do MongoDB e gera data/analytics_report.json
  
  2. PDF on-demand:   python analytics_engine.py --generate-pdf --output <path>
     → Recebe JSON via stdin, gera PDF visual com matplotlib
"""

import json
import sys
import os
import argparse
from datetime import datetime, timedelta
from pymongo import MongoClient

# ─── Configurações ───────────────────────────────────────────────────────────
MONGO_URI = "mongodb://127.0.0.1:27017/edutrack"
DATABASE_NAME = "edutrack"
OUTPUT_FILE = os.path.join("data", "analytics_report.json")


def calc_deviation(tempo_real, tempo_estimado):
    """
    Calcula o desvio percentual entre tempo real e estimado.
    Retorna None se tempo_estimado for 0 ou None.
    
    Fórmula: ((tempo_real - tempo_estimado) / tempo_estimado) * 100
    """
    if not tempo_estimado or tempo_estimado == 0:
        return None
    return ((tempo_real - tempo_estimado) / tempo_estimado) * 100


def calculate_analytics(user_id=None):
    """
    Modo Batch: Lê dados do MongoDB e gera analytics_report.json
    com desvios percentuais e contexto para insights.
    """
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        db = client[DATABASE_NAME]
        
        # Verifica conexão
        client.server_info()
        
        # Filtros por usuário se fornecido
        subject_filter = {}
        task_filter = {"is_deleted": False}
        
        if user_id:
            from bson import ObjectId
            try:
                # Tenta converter para ObjectId se possível, senão usa string
                uid = ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id
                subject_filter["user_id"] = uid
                task_filter["user_id"] = uid
            except Exception:
                subject_filter["user_id"] = user_id
                task_filter["user_id"] = user_id

        subjects = list(db.subjects.find(subject_filter))
        tasks = list(db.academictasks.find(task_filter))
        
        report = {
            "generated_at": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
            "user_id": user_id,
            "subjects": [],
            "global_metrics": {},
            "deviations": [],
            "insights_context": {}
        }
        
        total_weight = 0
        total_weight_completed = 0
        total_real_time_min = 0
        total_estimated_time_min = 0
        
        for sub in subjects:
            sub_id = sub['_id']
            sub_tasks = [t for t in tasks if str(t.get('subject_id')) == str(sub_id)]
            
            # Pesos
            sub_weight = sum([t.get('peso', 1) for t in sub_tasks])
            sub_weight_completed = sum([t.get('peso', 1) for t in sub_tasks if t.get('status') == 'concluida'])
            
            # Tempos (tratamento robusto de null/None)
            sub_time_real = sum([t.get('tempo_real', 0) or 0 for t in sub_tasks if t.get('status') == 'concluida'])
            sub_time_estimated = sum([t.get('tempo_estimado', 0) or 0 for t in sub_tasks])
            
            # Progresso ponderado
            progress = (float(sub_weight_completed) / sub_weight * 100) if sub_weight > 0 else 0
            
            # Eficiência (Real vs Estimado)
            efficiency = (float(sub_time_real) / sub_time_estimated) if sub_time_estimated > 0 else 0
            
            # Desvio percentual (nova métrica)
            deviation = calc_deviation(sub_time_real, sub_time_estimated)
            
            subject_entry = {
                "id": str(sub_id),
                "nome": sub.get('nome', 'Sem nome'),
                "subject_name": sub.get('nome', 'Sem nome'),
                "progress_weighted": round(progress, 2),
                "total_weight": sub_weight,
                "completed_weight": sub_weight_completed,
                "time_real_min": sub_time_real,
                "total_hours": round(sub_time_real / 60, 2),
                "time_estimated_min": sub_time_estimated,
                "efficiency_ratio": round(efficiency, 2),
                "deviation_percent": round(deviation, 2) if deviation is not None else None,
            }
            
            report["subjects"].append(subject_entry)
            
            # Desvios para contexto de insights
            report["deviations"].append({
                "subject": sub.get('nome', 'Sem nome'),
                "deviation_percent": round(deviation, 2) if deviation is not None else None,
                "status": "sem_dados" if deviation is None else
                          "acima" if deviation > 20 else
                          "abaixo" if deviation < -10 else "no_prazo",
            })
            
            total_weight += sub_weight
            total_weight_completed += sub_weight_completed
            total_real_time_min += sub_time_real
            total_estimated_time_min += sub_time_estimated

        # Cálculos Globais
        global_progress = (float(total_weight_completed) / total_weight * 100) if total_weight > 0 else 0
        velocity = (float(total_weight_completed) / total_real_time_min) if total_real_time_min > 0 else 0
        remaining_weight = total_weight - total_weight_completed
        
        eta_date = None
        if velocity > 0:
            minutes_to_finish = remaining_weight / velocity
            eta_date = (datetime.now() + timedelta(minutes=minutes_to_finish)).strftime("%Y-%m-%dT%H:%M:%S")
        
        global_deviation = calc_deviation(total_real_time_min, total_estimated_time_min)
        
        report["global_metrics"] = {
            "overall_progress": round(global_progress, 2),
            "total_points": total_weight,
            "completed_points": total_weight_completed,
            "velocity_points_per_min": round(velocity, 4),
            "total_time_spent_min": total_real_time_min,
            "total_time_estimated_min": total_estimated_time_min,
            "forecasted_completion_date": eta_date,
            "global_deviation_percent": round(global_deviation, 2) if global_deviation is not None else None,
        }
        
        # Contexto para IA (consumido pelo Gemini)
        report["insights_context"] = {
            "total_subjects": len(subjects),
            "subjects_with_time_data": len([d for d in report["deviations"] if d["status"] != "sem_dados"]),
            "subjects_above_schedule": len([d for d in report["deviations"] if d["status"] == "acima"]),
            "subjects_below_schedule": len([d for d in report["deviations"] if d["status"] == "abaixo"]),
            "subjects_on_track": len([d for d in report["deviations"] if d["status"] == "no_prazo"]),
        }
        
        # Nome do arquivo customizado por usuário
        output_file = OUTPUT_FILE
        if user_id:
            output_file = os.path.join("data", f"analytics_report_{user_id}.json")

        # Garante que o diretório existe
        os.makedirs(os.path.dirname(output_file), exist_ok=True)
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=4, ensure_ascii=False)
        
        print(f"Sucesso: Relatorio JSON gerado em: {output_file}")
        
    except Exception as e:
        print(f"Erro Critico na execucao do motor analitico: {e}")
        sys.exit(1)


def generate_pdf_report(output_path):
    """
    Modo PDF: Recebe dados JSON via stdin e gera um relatório visual em PDF.
    Usa matplotlib para gráficos e fpdf2 para montagem do documento.
    """
    try:
        import matplotlib
        matplotlib.use('Agg')  # Backend sem GUI
        import matplotlib.pyplot as plt
        import matplotlib.patches as mpatches
        from fpdf import FPDF
        import tempfile
    except ImportError as e:
        print(f"Dependência ausente: {e}. Instale com: pip install matplotlib fpdf2", file=sys.stderr)
        sys.exit(1)

    # Ler JSON do stdin
    raw_input = sys.stdin.read()
    if not raw_input.strip():
        print("Erro: Nenhum dado recebido via stdin.", file=sys.stderr)
        sys.exit(1)
    
    data = json.loads(raw_input)
    subjects = data.get('subjects', [])
    recommendations = data.get('ai_recommendations', [])
    ai_summary = data.get('ai_summary', 'Sem insights disponíveis.')
    generated_at = data.get('generated_at', datetime.now().isoformat())
    
    # ─── Gerar gráficos com matplotlib ────────────────────────────────────────
    chart_paths = []
    
    # 1. Gráfico de barras: Progresso por disciplina
    if subjects:
        fig, ax = plt.subplots(figsize=(8, max(3, len(subjects) * 0.7)))
        names = [s['nome'][:25] for s in subjects]
        progress_vals = [s.get('progress', 0) for s in subjects]
        
        colors = []
        for p in progress_vals:
            if p >= 80:
                colors.append('#10b981')  # emerald
            elif p >= 50:
                colors.append('#4f46e5')  # indigo
            elif p > 0:
                colors.append('#3b82f6')  # blue
            else:
                colors.append('#cbd5e1')  # gray
        
        bars = ax.barh(names, progress_vals, color=colors, height=0.6, edgecolor='none')
        ax.set_xlim(0, 105)
        ax.set_xlabel('Progresso (%)', fontsize=10, fontweight='bold', color='#374151')
        ax.set_title('Progresso por Disciplina', fontsize=14, fontweight='bold', color='#111827', pad=15)
        
        for bar, val in zip(bars, progress_vals):
            ax.text(bar.get_width() + 1.5, bar.get_y() + bar.get_height() / 2,
                    f'{val}%', va='center', fontsize=9, fontweight='bold', color='#4b5563')
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['bottom'].set_color('#e5e7eb')
        ax.spines['left'].set_color('#e5e7eb')
        ax.tick_params(axis='y', labelsize=9, colors='#374151')
        ax.tick_params(axis='x', labelsize=8, colors='#9ca3af')
        ax.invert_yaxis()
        
        plt.tight_layout()
        progress_chart = tempfile.mktemp(suffix='.png')
        plt.savefig(progress_chart, dpi=150, bbox_inches='tight', facecolor='white')
        plt.close()
        chart_paths.append(progress_chart)
    
    # 2. Gráfico: Tempo Estimado vs Real
    subjects_with_time = [s for s in subjects if (s.get('tempo_estimado', 0) > 0 or s.get('tempo_real', 0) > 0)]
    if subjects_with_time:
        fig, ax = plt.subplots(figsize=(8, max(3, len(subjects_with_time) * 0.8)))
        names = [s['nome'][:25] for s in subjects_with_time]
        estimado = [s.get('tempo_estimado', 0) for s in subjects_with_time]
        real = [s.get('tempo_real', 0) for s in subjects_with_time]
        
        y_pos = range(len(names))
        bar_height = 0.35
        
        ax.barh([y - bar_height/2 for y in y_pos], estimado, bar_height,
                label='Estimado', color='#cbd5e1', edgecolor='none')
        ax.barh([y + bar_height/2 for y in y_pos], real, bar_height,
                label='Real', color='#4f46e5', edgecolor='none')
        
        ax.set_yticks(list(y_pos))
        ax.set_yticklabels(names, fontsize=9, color='#374151')
        ax.set_xlabel('Tempo (minutos)', fontsize=10, fontweight='bold', color='#374151')
        ax.set_title('Tempo Estimado vs Tempo Real', fontsize=14, fontweight='bold', color='#111827', pad=15)
        ax.legend(loc='lower right', fontsize=9, frameon=False)
        
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['bottom'].set_color('#e5e7eb')
        ax.spines['left'].set_color('#e5e7eb')
        ax.invert_yaxis()
        
        plt.tight_layout()
        time_chart = tempfile.mktemp(suffix='.png')
        plt.savefig(time_chart, dpi=150, bbox_inches='tight', facecolor='white')
        plt.close()
        chart_paths.append(time_chart)
    
    # ─── Montar PDF com fpdf2 ─────────────────────────────────────────────────
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()
    
    # Header
    pdf.set_fill_color(31, 41, 55)  # gray-800
    pdf.rect(0, 0, 210, 45, 'F')
    
    pdf.set_text_color(255, 255, 255)
    pdf.set_font('Helvetica', 'B', 22)
    pdf.set_y(10)
    pdf.cell(0, 10, 'EduTrack AI', align='C', new_x='LMARGIN', new_y='NEXT')
    
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(200, 200, 220)
    pdf.cell(0, 8, 'Relatorio de Performance Academica', align='C', new_x='LMARGIN', new_y='NEXT')
    
    pdf.set_font('Helvetica', '', 8)
    pdf.set_text_color(160, 170, 190)
    report_date = datetime.fromisoformat(generated_at.replace('Z', '+00:00')).strftime('%d/%m/%Y as %H:%M') if generated_at else datetime.now().strftime('%d/%m/%Y as %H:%M')
    pdf.cell(0, 6, f'Gerado em {report_date}', align='C', new_x='LMARGIN', new_y='NEXT')
    
    pdf.ln(15)
    
    # Resumo AI
    pdf.set_text_color(31, 41, 55)
    pdf.set_font('Helvetica', 'B', 14)
    pdf.cell(0, 10, 'Resumo da Inteligencia Artificial', new_x='LMARGIN', new_y='NEXT')
    
    pdf.set_draw_color(79, 70, 229)  # indigo-600
    pdf.set_line_width(0.8)
    pdf.line(10, pdf.get_y(), 70, pdf.get_y())
    pdf.ln(4)
    
    pdf.set_font('Helvetica', 'I', 10)
    pdf.set_text_color(75, 85, 99)
    safe_summary = ai_summary.encode('latin-1', 'replace').decode('latin-1')
    pdf.multi_cell(0, 6, safe_summary)
    pdf.ln(4)
    
    # Recomendações
    if recommendations:
        pdf.set_font('Helvetica', 'B', 12)
        pdf.set_text_color(31, 41, 55)
        pdf.cell(0, 10, 'Recomendacoes Personalizadas', new_x='LMARGIN', new_y='NEXT')
        
        pdf.set_draw_color(16, 185, 129)  # emerald-500
        pdf.set_line_width(0.8)
        pdf.line(10, pdf.get_y(), 70, pdf.get_y())
        pdf.ln(4)
        
        for i, rec in enumerate(recommendations, 1):
            pdf.set_font('Helvetica', 'B', 9)
            pdf.set_text_color(79, 70, 229)
            pdf.cell(8, 6, f'{i}.')
            
            pdf.set_font('Helvetica', '', 9)
            pdf.set_text_color(55, 65, 81)
            safe_rec = rec.encode('latin-1', 'replace').decode('latin-1')
            pdf.multi_cell(0, 6, safe_rec)
            pdf.ln(2)
    
    pdf.ln(4)
    
    # Tabela de disciplinas
    pdf.set_font('Helvetica', 'B', 12)
    pdf.set_text_color(31, 41, 55)
    pdf.cell(0, 10, 'Detalhamento por Disciplina', new_x='LMARGIN', new_y='NEXT')
    
    pdf.set_draw_color(59, 130, 246)  # blue-500
    pdf.set_line_width(0.8)
    pdf.line(10, pdf.get_y(), 70, pdf.get_y())
    pdf.ln(4)
    
    if subjects:
        # Header da tabela
        pdf.set_fill_color(243, 244, 246)  # gray-100
        pdf.set_font('Helvetica', 'B', 8)
        pdf.set_text_color(55, 65, 81)
        col_widths = [55, 25, 30, 30, 25, 25]
        headers = ['Disciplina', 'Progresso', 'Est. (min)', 'Real (min)', 'Desvio', 'Tarefas']
        for w, h in zip(col_widths, headers):
            pdf.cell(w, 8, h, border=1, align='C', fill=True)
        pdf.ln()
        
        # Linhas da tabela
        pdf.set_font('Helvetica', '', 8)
        for s in subjects:
            pdf.set_text_color(55, 65, 81)
            nome = s['nome'][:28].encode('latin-1', 'replace').decode('latin-1')
            
            deviation = None
            est = s.get('tempo_estimado', 0)
            real = s.get('tempo_real', 0)
            if est and est > 0:
                deviation = ((real - est) / est) * 100
            
            dev_str = f'{deviation:+.1f}%' if deviation is not None else 'N/A'
            
            pdf.cell(col_widths[0], 7, nome, border=1)
            pdf.cell(col_widths[1], 7, f'{s.get("progress", 0)}%', border=1, align='C')
            pdf.cell(col_widths[2], 7, str(est), border=1, align='C')
            pdf.cell(col_widths[3], 7, str(real), border=1, align='C')
            pdf.cell(col_widths[4], 7, dev_str, border=1, align='C')
            pdf.cell(col_widths[5], 7, f'{s.get("completed_count", 0)}/{s.get("task_count", 0)}', border=1, align='C')
            pdf.ln()
    
    # Gráficos
    for chart_path in chart_paths:
        if os.path.exists(chart_path):
            pdf.add_page()
            pdf.image(chart_path, x=10, y=20, w=190)
            # Limpar arquivo temporário
            try:
                os.remove(chart_path)
            except OSError:
                pass
    
    # Footer na última página
    pdf.set_y(-30)
    pdf.set_font('Helvetica', 'I', 7)
    pdf.set_text_color(156, 163, 175)
    pdf.cell(0, 5, 'Este relatorio foi gerado automaticamente pelo EduTrack AI usando inteligencia artificial (Gemini 1.5 Pro).', align='C', new_x='LMARGIN', new_y='NEXT')
    pdf.cell(0, 5, 'Os dados refletem o estado atual das suas disciplinas e tarefas academicas.', align='C')
    
    # Salvar PDF
    os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else '.', exist_ok=True)
    pdf.output(output_path)
    print(f"PDF gerado com sucesso: {output_path}")


# ─── Entry Point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='EduTrack AI - Motor Analítico')
    parser.add_argument('--generate-pdf', action='store_true', 
                        help='Modo PDF: recebe JSON via stdin e gera PDF visual')
    parser.add_argument('--output', type=str, default='data/report.pdf',
                        help='Caminho de saída do PDF')
    parser.add_argument('--user-id', type=str, help='ID do usuário para filtrar dados')
    
    args = parser.parse_args()
    
    if args.generate_pdf:
        generate_pdf_report(args.output)
    else:
        calculate_analytics(args.user_id)
