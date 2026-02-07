"""
DAG Validator Module
Validates Airflow DAG syntax, structure, and correctness
"""

import ast
import logging
import re
from typing import Dict, List, Any, Set
from datetime import datetime

logger = logging.getLogger(__name__)


class DAGValidator:
    """Validates Airflow DAG code and specifications"""
    
    # Valid Airflow operators
    VALID_OPERATORS = {
        'BashOperator', 'PythonOperator', 'EmailOperator', 'SimpleHttpOperator',
        'PostgresOperator', 'MySqlOperator', 'SqliteOperator', 'MsSqlOperator',
        'OracleOperator', 'S3FileTransformOperator', 'S3ToRedshiftOperator',
        'RedshiftToS3Operator', 'BigQueryOperator', 'BigQueryCreateEmptyTableOperator',
        'GCSToGoogleDriveOperator', 'SnowflakeOperator', 'SparkSubmitOperator',
        'DatabricksSubmitRunOperator', 'KubernetesPodOperator', 'DockerOperator',
        'EmptyOperator', 'BranchPythonOperator', 'ShortCircuitOperator',
        'TriggerDagRunOperator', 'ExternalTaskSensor', 'HttpSensor',
        'S3KeySensor', 'SqlSensor', 'TimeDeltaSensor'
    }
    
    # Valid schedule presets
    VALID_SCHEDULES = {
        '@once', '@hourly', '@daily', '@weekly', '@monthly', '@yearly',
        '@annually', None, 'None', 'null'
    }
    
    def __init__(self):
        self.errors = []
        self.warnings = []
    
    def validate_syntax(self, dag_code: str) -> dict:
        """
        Validate Python syntax of DAG code using AST parsing
        
        Args:
            dag_code: Python code as string
            
        Returns:
            dict with validation results
        """
        self.errors = []
        self.warnings = []
        
        if not dag_code or not dag_code.strip():
            self.errors.append({
                'type': 'syntax',
                'line': 0,
                'message': 'DAG code is empty'
            })
            return self._build_result()
        
        try:
            # Parse the Python code to check syntax
            tree = ast.parse(dag_code)
            logger.info("DAG syntax validation passed")
            
            # Perform deeper structural checks
            self._check_dag_structure(tree, dag_code)
            
            return self._build_result()
            
        except SyntaxError as e:
            error_msg = f"Syntax error at line {e.lineno}: {e.msg}"
            logger.error(error_msg)
            self.errors.append({
                'type': 'syntax',
                'line': e.lineno or 0,
                'message': error_msg,
                'details': str(e.text).strip() if e.text else None
            })
            return self._build_result()
        except Exception as e:
            logger.error(f"Unexpected validation error: {str(e)}")
            self.errors.append({
                'type': 'validation',
                'line': 0,
                'message': f"Validation error: {str(e)}"
            })
            return self._build_result()
    
    def _check_dag_structure(self, tree: ast.AST, code: str) -> None:
        """
        Check for Airflow DAG-specific patterns in the AST
        
        Args:
            tree: Parsed AST tree
            code: Original source code
        """
        has_dag_import = False
        has_dag_definition = False
        has_tasks = False
        
        # Check imports
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom):
                if node.module and 'airflow' in node.module:
                    has_dag_import = True
                    if any(alias.name == 'DAG' for alias in node.names):
                        has_dag_definition = True
            
            # Check for DAG instantiation
            if isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name) and node.func.id == 'DAG':
                    has_dag_definition = True
                # Check for operator usage
                if isinstance(node.func, ast.Name):
                    if any(op in node.func.id for op in ['Operator', 'Sensor']):
                        has_tasks = True
        
        # Warnings for missing components
        if not has_dag_import:
            self.warnings.append({
                'type': 'structure',
                'message': 'No Airflow imports detected. Ensure you import from airflow modules.'
            })
        
        if not has_dag_definition:
            self.warnings.append({
                'type': 'structure',
                'message': 'No DAG definition found. A DAG object must be instantiated.'
            })
        
        if not has_tasks:
            self.warnings.append({
                'type': 'structure',
                'message': 'No task operators detected. DAG should contain at least one task.'
            })
    
    def validate_structure(self, dag_spec: dict) -> dict:
        """
        Validate DAG JSON specification structure and logic
        
        Args:
            dag_spec: JSON specification of DAG
            
        Returns:
            dict with validation results
        """
        self.errors = []
        self.warnings = []
        
        if not dag_spec:
            self.errors.append({
                'type': 'structure',
                'field': 'root',
                'message': 'DAG specification is empty'
            })
            return self._build_result()
        
        # Required fields validation
        self._validate_required_fields(dag_spec)
        
        # DAG ID validation
        self._validate_dag_id(dag_spec.get('dag_id'))
        
        # Schedule validation
        self._validate_schedule(dag_spec.get('schedule'))
        
        # Start date validation
        self._validate_start_date(dag_spec.get('start_date'))
        
        # Tasks validation
        self._validate_tasks(dag_spec.get('tasks', []))
        
        # Connections validation
        self._validate_connections(dag_spec.get('connections', []))
        
        # Variables validation
        self._validate_variables(dag_spec.get('variables', []))
        
        # Dependencies validation
        self._validate_dependencies(dag_spec.get('tasks', []))
        
        return self._build_result()
    
    def _validate_required_fields(self, spec: dict) -> None:
        """Check required fields are present"""
        required = ['dag_id', 'description', 'schedule', 'tasks']
        
        for field in required:
            if field not in spec or spec[field] is None:
                if field == 'schedule':
                    # Schedule can be None, just warn
                    self.warnings.append({
                        'type': 'field',
                        'field': field,
                        'message': f'Schedule is None - DAG will not run automatically'
                    })
                else:
                    self.errors.append({
                        'type': 'field',
                        'field': field,
                        'message': f'Required field "{field}" is missing or null'
                    })
    
    def _validate_dag_id(self, dag_id: str) -> None:
        """Validate DAG ID format"""
        if not dag_id:
            return  # Already caught by required fields
        
        # Check format: alphanumeric, underscores, hyphens only
        if not re.match(r'^[a-zA-Z0-9_-]+$', dag_id):
            self.errors.append({
                'type': 'format',
                'field': 'dag_id',
                'message': f'DAG ID "{dag_id}" contains invalid characters. Use only letters, numbers, underscores, and hyphens.'
            })
        
        # Check length
        if len(dag_id) > 100:
            self.errors.append({
                'type': 'format',
                'field': 'dag_id',
                'message': f'DAG ID is too long ({len(dag_id)} chars). Maximum is 100 characters.'
            })
        
        # Best practice: lowercase with underscores
        if dag_id != dag_id.lower():
            self.warnings.append({
                'type': 'format',
                'field': 'dag_id',
                'message': f'DAG ID should be lowercase for consistency. Consider: "{dag_id.lower()}"'
            })
    
    def _validate_schedule(self, schedule: str) -> None:
        """Validate schedule format"""
        if schedule is None or schedule in ['None', 'null']:
            return  # None is valid
        
        # Check if it's a preset
        if schedule in self.VALID_SCHEDULES:
            return
        
        # Check if it's a cron expression (basic validation)
        cron_pattern = r'^(@(yearly|annually|monthly|weekly|daily|hourly|reboot))|(@every (\d+(ns|us|µs|ms|s|m|h))+)|((((\d+,)+\d+|(\d+(\/|-)\d+)|\d+|\*) ?){5,7})$'
        if not re.match(cron_pattern, schedule.strip()):
            self.warnings.append({
                'type': 'format',
                'field': 'schedule',
                'message': f'Schedule "{schedule}" may not be a valid cron expression or preset'
            })
    
    def _validate_start_date(self, start_date: str) -> None:
        """Validate start date format"""
        if not start_date:
            self.warnings.append({
                'type': 'field',
                'field': 'start_date',
                'message': 'No start_date specified. Will use default.'
            })
            return
        
        # Try to parse as ISO date
        try:
            datetime.fromisoformat(start_date)
        except (ValueError, TypeError):
            self.errors.append({
                'type': 'format',
                'field': 'start_date',
                'message': f'Invalid date format "{start_date}". Use YYYY-MM-DD.'
            })
    
    def _validate_tasks(self, tasks: List[dict]) -> None:
        """Validate task definitions"""
        if not tasks:
            self.errors.append({
                'type': 'structure',
                'field': 'tasks',
                'message': 'DAG must contain at least one task'
            })
            return
        
        task_ids = set()
        
        for i, task in enumerate(tasks):
            # Required task fields
            if 'task_id' not in task:
                self.errors.append({
                    'type': 'field',
                    'field': f'tasks[{i}].task_id',
                    'message': f'Task at index {i} is missing task_id'
                })
                continue
            
            task_id = task['task_id']
            
            # Check for duplicate task IDs
            if task_id in task_ids:
                self.errors.append({
                    'type': 'duplicate',
                    'field': 'task_id',
                    'message': f'Duplicate task_id: "{task_id}"'
                })
            task_ids.add(task_id)
            
            # Validate task_id format
            if not re.match(r'^[a-zA-Z0-9_-]+$', task_id):
                self.errors.append({
                    'type': 'format',
                    'field': f'tasks[{i}].task_id',
                    'message': f'Task ID "{task_id}" contains invalid characters'
                })
            
            # Validate operator type
            operator_type = task.get('operator_type')
            if not operator_type:
                self.errors.append({
                    'type': 'field',
                    'field': f'tasks[{i}].operator_type',
                    'message': f'Task "{task_id}" is missing operator_type'
                })
            elif operator_type not in self.VALID_OPERATORS:
                self.warnings.append({
                    'type': 'operator',
                    'field': f'tasks[{i}].operator_type',
                    'message': f'Unknown operator type: "{operator_type}". May not be supported.'
                })
            
            # Validate operator parameters
            params = task.get('params', {})
            if operator_type and not params:
                self.warnings.append({
                    'type': 'params',
                    'field': f'tasks[{i}].params',
                    'message': f'Task "{task_id}" has no parameters. Operator may require configuration.'
                })
    
    def _validate_connections(self, connections: List[dict]) -> None:
        """Validate connection definitions"""
        conn_ids = set()
        
        for i, conn in enumerate(connections):
            if 'conn_id' not in conn:
                self.errors.append({
                    'type': 'field',
                    'field': f'connections[{i}].conn_id',
                    'message': f'Connection at index {i} is missing conn_id'
                })
                continue
            
            conn_id = conn['conn_id']
            
            # Check for duplicates
            if conn_id in conn_ids:
                self.errors.append({
                    'type': 'duplicate',
                    'field': 'conn_id',
                    'message': f'Duplicate connection ID: "{conn_id}"'
                })
            conn_ids.add(conn_id)
            
            # Validate conn_type
            if 'conn_type' not in conn:
                self.errors.append({
                    'type': 'field',
                    'field': f'connections[{i}].conn_type',
                    'message': f'Connection "{conn_id}" is missing conn_type'
                })
    
    def _validate_variables(self, variables: List[dict]) -> None:
        """Validate variable definitions"""
        var_keys = set()
        
        for i, var in enumerate(variables):
            if 'key' not in var:
                self.errors.append({
                    'type': 'field',
                    'field': f'variables[{i}].key',
                    'message': f'Variable at index {i} is missing key'
                })
                continue
            
            key = var['key']
            
            # Check for duplicates
            if key in var_keys:
                self.warnings.append({
                    'type': 'duplicate',
                    'field': 'variable_key',
                    'message': f'Duplicate variable key: "{key}"'
                })
            var_keys.add(key)
    
    def _validate_dependencies(self, tasks: List[dict]) -> None:
        """Validate task dependencies form a valid DAG (no cycles)"""
        if not tasks:
            return
        
        # Build task ID set
        task_ids = {task['task_id'] for task in tasks if 'task_id' in task}
        
        # Check all dependencies reference valid tasks
        for task in tasks:
            if 'task_id' not in task:
                continue
            
            task_id = task['task_id']
            dependencies = task.get('dependencies', [])
            
            for dep in dependencies:
                if dep not in task_ids:
                    self.errors.append({
                        'type': 'dependency',
                        'field': 'dependencies',
                        'message': f'Task "{task_id}" depends on non-existent task "{dep}"'
                    })
                
                # Self-dependency check
                if dep == task_id:
                    self.errors.append({
                        'type': 'dependency',
                        'field': 'dependencies',
                        'message': f'Task "{task_id}" cannot depend on itself'
                    })
        
        # Check for circular dependencies
        if self._has_circular_dependencies(tasks):
            self.errors.append({
                'type': 'dependency',
                'field': 'dependencies',
                'message': 'Circular dependency detected in task graph'
            })
    
    def _has_circular_dependencies(self, tasks: List[dict]) -> bool:
        """Detect circular dependencies using DFS"""
        # Build adjacency list
        graph = {}
        for task in tasks:
            if 'task_id' not in task:
                continue
            task_id = task['task_id']
            graph[task_id] = task.get('dependencies', [])
        
        # DFS to detect cycles
        visited = set()
        rec_stack = set()
        
        def has_cycle(node):
            visited.add(node)
            rec_stack.add(node)
            
            for neighbor in graph.get(node, []):
                if neighbor not in visited:
                    if has_cycle(neighbor):
                        return True
                elif neighbor in rec_stack:
                    return True
            
            rec_stack.remove(node)
            return False
        
        for node in graph:
            if node not in visited:
                if has_cycle(node):
                    return True
        
        return False
    
    def _build_result(self) -> dict:
        """Build validation result dictionary"""
        return {
            'valid': len(self.errors) == 0,
            'errors': self.errors,
            'warnings': self.warnings
        }
