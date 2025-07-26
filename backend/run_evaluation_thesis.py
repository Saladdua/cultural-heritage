#!/usr/bin/env python3
"""
Comprehensive evaluation script for thesis
This script will evaluate all your models and generate thesis-ready results
"""

import json
import sys
import os
from datetime import datetime
from evaluation_simple import SimpleModelEvaluator

def main():
    print("🎓 THESIS EVALUATION SYSTEM")
    print("=" * 50)
    
    # Database configuration
    db_config = {
        'host': 'localhost',
        'user': 'heritage_user',
        'password': 'heritage_password123',
        'database': 'cultural_heritage',
        'autocommit': True
    }
    
    # Create evaluator
    evaluator = SimpleModelEvaluator(db_config)
    
    print("📊 Step 1: Checking Database Status...")
    db_status = evaluator.check_database_status()
    
    if 'error' in db_status:
        print(f"❌ Database error: {db_status['error']}")
        print("\n🔧 Troubleshooting:")
        print("1. Make sure MySQL is running")
        print("2. Check if your Flask backend is running: python app.py")
        print("3. Verify database credentials in the script")
        return
    
    print(f"✅ Database connected successfully!")
    print(f"📁 Folders: {db_status['folder_count']}")
    print(f"🎯 Models: {db_status['model_count']}")
    
    if db_status['model_count'] == 0:
        print("\n⚠️  No models found for evaluation!")
        print("Please upload some 3D models first:")
        print("1. Open http://localhost:3000")
        print("2. Create folders and upload your 3D models")
        print("3. Then run this evaluation again")
        return
    
    print(f"\n📋 Models to evaluate:")
    for model in db_status['models']:
        print(f"  • {model['name']} ({model['file_type'].upper()}) in {model['folder_name']}")
    
    print(f"\n📊 Step 2: Running Comprehensive Evaluation...")
    print("-" * 50)
    
    # Run evaluation
    results = evaluator.evaluate_all_models()
    
    if 'error' in results:
        print(f"❌ Evaluation failed: {results['error']}")
        return
    
    # Save detailed results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"thesis_evaluation_results_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"✅ Evaluation completed!")
    print(f"💾 Results saved to: {results_file}")
    
    # Generate thesis summary
    generate_thesis_summary(results, timestamp)
    
    print(f"\n🎓 THESIS EVALUATION COMPLETE!")
    print("=" * 50)

def generate_thesis_summary(results, timestamp):
    """Generate a thesis-ready summary"""
    
    summary_file = f"thesis_evaluation_summary_{timestamp}.txt"
    
    with open(summary_file, 'w') as f:
        f.write("3D CULTURAL HERITAGE VISUALIZATION EVALUATION\n")
        f.write("Triangle Mesh Representation Analysis\n")
        f.write("=" * 60 + "\n\n")
        
        f.write(f"Evaluation Date: {results['evaluation_timestamp']}\n")
        f.write(f"Total Models Evaluated: {results['total_models']}\n\n")
        
        if 'summary_statistics' in results and results['summary_statistics']:
            stats = results['summary_statistics']
            
            f.write("OVERALL PERFORMANCE METRICS\n")
            f.write("-" * 30 + "\n")
            f.write(f"Geometric Accuracy: {stats['geometric_accuracy']['mean']:.3f} ± {stats['geometric_accuracy']['std']:.3f}\n")
            f.write(f"  Range: {stats['geometric_accuracy']['min']:.3f} - {stats['geometric_accuracy']['max']:.3f}\n\n")
            
            f.write(f"Performance Score: {stats['performance_score']['mean']:.3f} ± {stats['performance_score']['std']:.3f}\n")
            f.write(f"  Range: {stats['performance_score']['min']:.3f} - {stats['performance_score']['max']:.3f}\n\n")
            
            f.write(f"Interaction Quality: {stats['interaction_quality']['mean']:.3f} ± {stats['interaction_quality']['std']:.3f}\n")
            f.write(f"  Range: {stats['interaction_quality']['min']:.3f} - {stats['interaction_quality']['max']:.3f}\n\n")
            
            f.write(f"Cultural Heritage Suitability: {stats['cultural_heritage_suitability']['mean']:.3f} ± {stats['cultural_heritage_suitability']['std']:.3f}\n")
            f.write(f"  Range: {stats['cultural_heritage_suitability']['min']:.3f} - {stats['cultural_heritage_suitability']['max']:.3f}\n\n")
        
        # Individual model results
        if 'individual_results' in results:
            f.write("INDIVIDUAL MODEL ANALYSIS\n")
            f.write("-" * 25 + "\n")
            
            for model_id, result in results['individual_results'].items():
                model_info = result['model_info']
                metrics = result['metrics']
                
                f.write(f"\nModel: {model_info['name']}\n")
                f.write(f"Format: {model_info['file_type'].upper()}\n")
                f.write(f"Size: {(model_info['file_size'] / (1024*1024)):.1f} MB\n")
                f.write(f"Geometric Accuracy: {metrics['geometric_accuracy']:.3f}\n")
                f.write(f"Performance Score: {metrics['performance']['performance_score']:.3f}\n")
                f.write(f"Load Time: {metrics['performance']['load_time']:.3f}s\n")
                f.write(f"Memory Usage: {metrics['performance']['memory_usage']:.2f}MB\n")
                f.write(f"Interaction Quality: {metrics['interaction_quality']:.3f}\n")
                f.write(f"CH Suitability: {metrics['cultural_heritage_suitability']:.3f}\n")
        
        # Model comparison data
        if 'individual_results' in results and results['individual_results']:
            first_result = next(iter(results['individual_results'].values()))
            if 'model_comparison' in first_result:
                f.write(f"\n\nCOMPARISON WITH OTHER 3D VISUALIZATION METHODS\n")
                f.write("-" * 45 + "\n")
                
                comparison = first_result['model_comparison']
                f.write(f"{'Method':<20} {'Geo.Acc':<8} {'Perf.':<6} {'Inter.':<6} {'CH Suit.':<8}\n")
                f.write("-" * 50 + "\n")
                
                for method, metrics in comparison.items():
                    method_name = method.replace('_', ' ').title()
                    f.write(f"{method_name:<20} {metrics['geometric_accuracy']:<8.3f} {metrics['performance_score']:<6.1f} {metrics['interaction_quality']:<6.3f} {metrics['ch_suitability']:<8.3f}\n")
    
    print(f"📄 Thesis summary saved to: {summary_file}")

if __name__ == "__main__":
    main()
