from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
from validators.dag_validator import DAGValidator

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Health check endpoint
@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'dde-validator',
        'version': '1.0.0'
    }), 200


# Validate DAG syntax endpoint
@app.route('/validate/dag', methods=['POST'])
def validate_dag():
    """Validate Airflow DAG syntax and structure"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        dag_code = data.get('dag_code')
        dag_spec = data.get('dag_spec')
        
        if not dag_code and not dag_spec:
            return jsonify({'error': 'Either dag_code or dag_spec must be provided'}), 400
        
        validator = DAGValidator()
        results = {
            'syntax_validation': None,
            'structure_validation': None
        }
        
        # Validate Python code syntax if provided
        if dag_code:
            logger.info("Validating DAG code syntax")
            syntax_result = validator.validate_syntax(dag_code)
            results['syntax_validation'] = syntax_result
            
            if not syntax_result['valid']:
                logger.warning(f"Syntax validation failed with {len(syntax_result['errors'])} errors")
        
        # Validate JSON spec structure if provided
        if dag_spec:
            logger.info("Validating DAG specification structure")
            structure_result = validator.validate_structure(dag_spec)
            results['structure_validation'] = structure_result
            
            if not structure_result['valid']:
                logger.warning(f"Structure validation failed with {len(structure_result['errors'])} errors")
        
        # Combine results
        all_errors = []
        all_warnings = []
        
        if results['syntax_validation']:
            all_errors.extend(results['syntax_validation'].get('errors', []))
            all_warnings.extend(results['syntax_validation'].get('warnings', []))
        
        if results['structure_validation']:
            all_errors.extend(results['structure_validation'].get('errors', []))
            all_warnings.extend(results['structure_validation'].get('warnings', []))
        
        is_valid = len(all_errors) == 0
        
        response = {
            'valid': is_valid,
            'errors': all_errors,
            'warnings': all_warnings,
            'details': results
        }
        
        status_code = 200 if is_valid else 422  # 422 Unprocessable Entity for validation failures
        
        logger.info(f"Validation complete: valid={is_valid}, errors={len(all_errors)}, warnings={len(all_warnings)}")
        
        return jsonify(response), status_code
        
    except Exception as e:
        logger.error(f"Validation error: {str(e)}", exc_info=True)
        return jsonify({
            'error': 'Internal validation error',
            'details': str(e)
        }), 500


# Validate environment context endpoint
@app.route('/validate/environment', methods=['POST'])
def validate_environment():
    """Validate pipeline against environment configuration"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        # Placeholder - will be implemented in Task 12
        return jsonify({
            'valid': True,
            'message': 'Environment validation endpoint ready',
            'warnings': []
        }), 200
        
    except Exception as e:
        logger.error(f"Environment validation error: {str(e)}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5051))
    logger.info(f"Starting dde-validator on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
