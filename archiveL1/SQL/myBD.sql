/*SELECT d.department_id, d.department_name, COUNT(e.employee_id) FROM departments d, employees e
WHERE d.department_id = e.department_id
GROUP BY (d.department_id, d.department_name);*/

/*SELECT j.job_id, j.job_title, AVG(e.salary) AS moyenne_salaire FROM jobs j, employees e
WHERE j.job_id = e.job_id
GROUP BY (j.job_id, j.job_title)*/

/*SELECT j.job_title, j.max_salary - j.min_salary AS difference FROM JOBS j 
WHERE max_salary BETWEEN 10000 AND 20000*/

SELECT employees.first_name, jobs.job_title FROM employees 
LEFT JOIN jobs ON employees.job_id = jobs.job_id 
LEFT JOIN DEPARTMENTS ON employees.department_id = departments.department_id AND departments.location_id = locations.location_id