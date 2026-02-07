import { config } from '../../config';

// Non-stream (kept as fallback)
export async function sendChat(message: string) {
    const res = await fetch(config.endpoints.chat, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed: ${res.status}`);
    }

    return (await res.json()) as { reply: string };
}

// Generate pipeline specification (non-streaming)
export async function generatePipeline(
    message: string,
    parameters?: {
        schedule?: string;
        dataSource?: string;
        dataTarget?: string;
        tags?: string[];
    },
    file?: File
) {
    let body: any;
    let headers: any = {};

    // If file is provided, use FormData
    if (file) {
        const formData = new FormData();
        formData.append('message', message);
        formData.append('parameters', JSON.stringify(parameters || {}));
        formData.append('file', file);
        body = formData;
        // Don't set Content-Type header - browser will set it with boundary
    } else {
        // Otherwise use JSON
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({ message, parameters });
    }

    const res = await fetch(config.endpoints.pipelineGenerate, {
        method: "POST",
        headers,
        body,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed: ${res.status}`);
    }

    return (await res.json()) as {
        specification: any;
        validation: any;
        metadata: {
            generated_at: string;
            model: string;
        };
    };
}

// Refine pipeline specification with user feedback
export async function refineSpecification(
    currentSpec: any,
    userFeedback: string
) {
    const res = await fetch(config.endpoints.pipelineRefineSpec, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            current_spec: currentSpec, 
            user_feedback: userFeedback
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Specification refinement failed: ${res.status}`);
    }

    return (await res.json()) as {
        specification: any;
        validation: any;
        metadata: {
            refined_at: string;
            user_feedback: string;
            model: string;
        };
    };
}

// Refine generated Python code with user feedback
export async function refineDAGCode(
    currentCode: string,
    userFeedback: string,
    currentSpec?: any
) {
    const res = await fetch(config.endpoints.pipelineRefineCode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            current_code: currentCode,
            current_spec: currentSpec,
            user_feedback: userFeedback
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Code refinement failed: ${res.status}`);
    }

    return (await res.json()) as {
        code: string;
        validation: any;
        metadata: {
            refined_at: string;
            user_feedback: string;
            code_lines: number;
            model: string;
        };
    };
}

// Legacy function - keeping for backwards compatibility
export async function refinePipeline(
    currentSpec: any,
    feedback: string,
    validation?: any
) {
    return refineSpecification(currentSpec, feedback);
}

// Auto-fix validation errors
export async function fixPipelineErrors(
    currentSpec: any,
    validation: any
) {
    const res = await fetch(config.endpoints.pipelineFix, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            current_spec: currentSpec,
            validation 
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Auto-fix failed: ${res.status}`);
    }

    return (await res.json()) as {
        specification: any;
        validation: any;
        metadata: {
            fixed_at: string;
            model: string;
            original_errors: number;
            remaining_errors: number;
            fix_success: boolean;
        };
    };
}

// Stream (SSE over fetch)
export async function sendChatStream(
    message: string,
    onDelta: (chunk: string) => void
) {
    const res = await fetch(config.endpoints.chatStream, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Request failed: ${res.status}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No stream body returned");

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
            const eventLine = frame.split("\n").find((l) => l.startsWith("event:"));
            const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));

            if (!dataLine) continue;

            const event = eventLine?.slice("event:".length).trim();
            const data = JSON.parse(dataLine.slice("data:".length).trim());

            if (event === "delta") onDelta(data.delta ?? "");
            if (event === "done") return;
            if (event === "error") throw new Error(data.error || "Stream error");
        }
    }
}

export async function repairPipeline(
    currentSpec: any,
    maxIterations: number = 3
) {
    const res = await fetch(config.endpoints.pipelineRepair, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            current_spec: currentSpec, 
            max_iterations: maxIterations 
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Repair failed: ${res.status}`);
    }

    const result = await res.json();
    return {
        specification: result.specification,
        validation: result.validation,
        iterations: result.iterations || [],
        metadata: result.metadata || {}
    };
}

export async function generateDAGCode(specification: any) {
    const res = await fetch(config.endpoints.pipelineGenerateCode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specification }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Code generation failed: ${res.status}`);
    }

    const result = await res.json();
    return {
        code: result.code,
        filename: result.filename,
        metadata: result.metadata
    };
}
export async function exportPackage(specification: any, additionalPackages?: string[]) {
    const res = await fetch(config.endpoints.pipelineExport, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            specification,
            additionalPackages: additionalPackages || []
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Package export failed: ${res.status}`);
    }

    // Return the blob for download
    const blob = await res.blob();
    const filename = `${specification.dag_id}_pipeline.zip`;
    
    return {
        blob,
        filename
    };
}