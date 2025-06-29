#!/usr/bin/env python3
"""
Generate evaluation report for thesis
"""

import json
import sys
from datetime import datetime
import matplotlib.pyplot as plt
import numpy as np

def generate_latex_table(results):
    """Generate LaTeX table for thesis"""
    if 'model_comparison' not in results:
        return "No comparison data available"
    
    comparison = results['model_comparison']
    
    latex_table = """
\\begin{table}[h]
\\centering
\\caption{Comparison of 3D Visualization Models}
\\label{tab:model_comparison}
\\begin{tabular}{|l|c|c|c|c|}
\\hline
\\textbf{Visualization Model} & \\textbf{Geometric Accuracy} & \\textbf{Performance Score} & \\textbf{Interaction Quality} & \\textbf{CH Suitability} \\\\
\\hline
"""
    
    for model_name, metrics in comparison.items():
        model_display = model_name.replace('_', ' ').title()
        latex_table += f"{model_display} & {metrics['geometric_accuracy']:.2f} & {metrics['performance_score']:.1f} & {metrics['interaction_quality']:.2f} & {metrics['ch_suitability']:.2f} \\\\\n"
    
    latex_table += """\\hline
\\end{tabular}
\\end{table}
"""
    
    return latex_table

def generate_performance_chart(results):
    """Generate performance comparison chart"""
    if 'model_comparison' not in results:
        return
    
    comparison = results['model_comparison']
    models = list(comparison.keys())
    metrics = ['geometric_accuracy', 'performance_score', 'interaction_quality', 'ch_suitability']
    
    # Normalize performance_score to 0-1 scale for comparison
    normalized_data = {}
    for model in models:
        normalized_data[model] = [
            comparison[model]['geometric_accuracy'],
            comparison[model]['performance_score'] / 10.0,  # Normalize to 0-1
            comparison[model]['interaction_quality'],
            comparison[model]['ch_suitability']
        ]
    
    # Create radar chart
    angles = np.linspace(0, 2 * np.pi, len(metrics), endpoint=False).tolist()
    angles += angles[:1]  # Complete the circle
    
    fig, ax = plt.subplots(figsize=(10, 8), subplot_kw=dict(projection='polar'))
    
    colors = ['red', 'blue', 'green', 'orange', 'purple', 'brown']
    
    for i, (model, values) in enumerate(normalized_data.items()):
        values += values[:1]  # Complete the circle
        ax.plot(angles, values, 'o-', linewidth=2, label=model.replace('_', ' ').title(), color=colors[i % len(colors)])
        ax.fill(angles, values, alpha=0.25, color=colors[i % len(colors)])
    
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels([m.replace('_', ' ').title() for m in metrics])
    ax.set_ylim(0, 1)
    ax.legend(loc='upper right', bbox_to_anchor=(1.3, 1.0))
    ax.set_title('3D Visualization Models Comparison', size=16, weight='bold')
    
    plt.tight_layout()
    plt.savefig('model_comparison_radar.png', dpi=300, bbox_inches='tight')
    plt.close()

def main():
    if len(sys.argv) != 2:
        print("Usage: python generate_report.py <evaluation_results.json>")
        sys.exit(1)
    
    results_file = sys.argv[1]
    
    try:
        with open(results_file, 'r') as f:
            results = json.load(f)
    except FileNotFoundError:
        print(f"File not found: {results_file}")
        sys.exit(1)
    
    # Generate report
    report_file = f"evaluation_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    with open(report_file, 'w') as f:
        f.write("3D CULTURAL HERITAGE VISUALIZATION EVALUATION REPORT\n")
        f.write("=" * 60 + "\n\n")
        
        if 'total_models' in results:
            f.write(f"Total Models Evaluated: {results['total_models']}\n")
            f.write(f"Evaluation Date: {results['evaluation_timestamp']}\n\n")
        
        # Summary statistics
        if 'summary_statistics' in results:
            f.write("SUMMARY STATISTICS\n")
            f.write("-" * 20 + "\n")
            stats = results['summary_statistics']
            
            for metric, values in stats.items():
                f.write(f"{metric.replace('_', ' ').title()}:\n")
                f.write(f"  Mean: {values['mean']:.3f}\n")
                f.write(f"  Std Dev: {values['std']:.3f}\n")
                f.write(f"  Range: {values['min']:.3f} - {values['max']:.3f}\n\n")
        
        # Individual model results
        if 'individual_results' in results:
            f.write("INDIVIDUAL MODEL RESULTS\n")
            f.write("-" * 25 + "\n")
            
            for model_id, result in results['individual_results'].items():
                model_info = result['model_info']
                metrics = result['metrics']
                
                f.write(f"Model: {model_info['name']} (ID: {model_id})\n")
                f.write(f"Folder: {model_info['folder_name']}\n")
                f.write(f"File Type: {model_info['file_type']}\n")
                f.write(f"Geometric Accuracy: {metrics['geometric_accuracy']:.3f}\n")
                f.write(f"Performance Score: {metrics['performance']['performance_score']:.3f}\n")
                f.write(f"Interaction Quality: {metrics['interaction_quality']:.3f}\n")
                f.write(f"CH Suitability: {metrics['cultural_heritage_suitability']:.3f}\n")
                f.write(f"Triangle Count: {metrics['performance']['triangle_count']}\n")
                f.write(f"Load Time: {metrics['performance']['load_time']:.3f}s\n")
                f.write(f"Memory Usage: {metrics['performance']['memory_usage']:.2f}MB\n\n")
        
        # LaTeX table
        if 'individual_results' in results:
            first_result = next(iter(results['individual_results'].values()))
            latex_table = generate_latex_table(first_result)
            f.write("LATEX TABLE FOR THESIS\n")
            f.write("-" * 22 + "\n")
            f.write(latex_table)
    
    print(f"Report generated: {report_file}")
    
    # Generate charts if matplotlib is available
    try:
        if 'individual_results' in results:
            first_result = next(iter(results['individual_results'].values()))
            generate_performance_chart(first_result)
            print("Performance chart generated: model_comparison_radar.png")
    except ImportError:
        print("Matplotlib not available. Install with: pip install matplotlib")

if __name__ == "__main__":
    main()
