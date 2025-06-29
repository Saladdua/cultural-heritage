#!/usr/bin/env python3
"""
Script to run evaluation on specific models or all models
Usage:
  python run_evaluation.py --all                    # Evaluate all models
  python run_evaluation.py --model 1                # Evaluate specific model
  python run_evaluation.py --folder 2               # Evaluate all models in folder
"""

import argparse
import json
import sys
from evaluation import ModelEvaluator
from datetime import datetime

def main():
    parser = argparse.ArgumentParser(description='Run 3D Model Evaluation')
    parser.add_argument('--all', action='store_true', help='Evaluate all models')
    parser.add_argument('--model', type=int, help='Evaluate specific model by ID')
    parser.add_argument('--folder', type=int, help='Evaluate all models in specific folder')
    parser.add_argument('--output', type=str, help='Output file path (optional)')
    
    args = parser.parse_args()
    
    # Database configuration
    db_config = {
        'host': 'localhost',
        'user': 'heritage_user',
        'password': 'heritage_password123',
        'database': 'cultural_heritage',
        'autocommit': True
    }
    
    evaluator = ModelEvaluator(db_config)
    
    if args.all:
        print("Evaluating all models...")
        results = evaluator.evaluate_all_models()
    elif args.model:
        print(f"Evaluating model ID: {args.model}")
        results = evaluator.evaluate_single_model(args.model)
    elif args.folder:
        print(f"Evaluating models in folder ID: {args.folder}")
        # Implementation for folder-specific evaluation
        results = {"error": "Folder-specific evaluation not implemented yet"}
    else:
        print("Please specify --all, --model ID, or --folder ID")
        sys.exit(1)
    
    # Save results
    if args.output:
        output_file = args.output
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        if args.all:
            output_file = f"evaluation_all_models_{timestamp}.json"
        elif args.model:
            output_file = f"evaluation_model_{args.model}_{timestamp}.json"
        else:
            output_file = f"evaluation_results_{timestamp}.json"
    
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"Results saved to: {output_file}")
    
    # Print summary
    if 'error' not in results:
        if args.model:
            metrics = results['metrics']
            print(f"\nModel Evaluation Results:")
            print(f"Geometric Accuracy: {metrics['geometric_accuracy']:.3f}")
            print(f"Performance Score: {metrics['performance']['performance_score']:.3f}")
            print(f"Interaction Quality: {metrics['interaction_quality']:.3f}")
            print(f"CH Suitability: {metrics['cultural_heritage_suitability']:.3f}")
        elif args.all and 'summary_statistics' in results:
            stats = results['summary_statistics']
            print(f"\nSummary Statistics for {results['total_models']} models:")
            print(f"Geometric Accuracy: {stats['geometric_accuracy']['mean']:.3f} ± {stats['geometric_accuracy']['std']:.3f}")
            print(f"Performance Score: {stats['performance_score']['mean']:.3f} ± {stats['performance_score']['std']:.3f}")
            print(f"Interaction Quality: {stats['interaction_quality']['mean']:.3f} ± {stats['interaction_quality']['std']:.3f}")
            print(f"CH Suitability: {stats['cultural_heritage_suitability']['mean']:.3f} ± {stats['cultural_heritage_suitability']['std']:.3f}")
    else:
        print(f"Error: {results['error']}")

if __name__ == "__main__":
    main()
