import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Lazy-initialize the Gemini API client to prevent startup crashes if key is missing during container build
let aiClient: GoogleGenAI | null = null;

function getGeminiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, projectTitle, projectDescription, tags } = body;

    if (!action) {
      return NextResponse.json(
        { error: "Action parameter is required ('generate-roadmap' or 'refine-description')" },
        { status: 400 }
      );
    }

    const ai = getGeminiClient();

    if (action === "generate-roadmap") {
      if (!projectTitle) {
        return NextResponse.json({ error: "projectTitle is required for roadmaps" }, { status: 400 });
      }

      const prompt = `Crie um planejamento/roadmap detalhado e minimalista para o seguinte projeto:
Título: ${projectTitle}
Descrição original: ${projectDescription || "Sem descrição fornecida."}
Tags/Tecnologias principais: ${tags ? tags.join(", ") : "Não especificadas"}

Por favor, gere uma lista de 5 a 8 tarefas cruciais em sequência lógica para tirar esse projeto do papel, recomende tecnologias complementares adequadas, estime a dificuldade geral do projeto, forneça uma estimativa de tempo ideal e dê conselhos/dicas úteis para evitar armadilhas comuns no desenvolvimento. Responda em português de forma clara e minimalista.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Você é um mentor técnico sênior e gerente de produtos. Suas respostas devem ser profissionais, extremamente práticas, realistas, motivadoras e estruturadas em formato JSON estrito em português do Brasil.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tasks: {
                type: Type.ARRAY,
                description: "Lista de tarefas sequenciais cruciais para o projeto",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: "Título curto da tarefa ou fase" },
                    description: { type: Type.STRING, description: "Explicação sucinta do que deve ser feito" },
                  },
                  required: ["title", "description"],
                },
              },
              technologies: {
                type: Type.ARRAY,
                description: "Lista de tecnologias, bibliotecas ou frameworks recomendados",
                items: { type: Type.STRING },
              },
              difficulty: {
                type: Type.STRING,
                description: "Nível de dificuldade estimado: Fácil, Médio ou Difícil",
              },
              timeEstimate: {
                type: Type.STRING,
                description: "Estimativa realista de tempo de desenvolvimento, ex: '2 a 3 semanas'",
              },
              copilotTips: {
                type: Type.STRING,
                description: "Conselhos e dicas valiosas de arquitetura e organização para o desenvolvedor",
              },
            },
            required: ["tasks", "technologies", "difficulty", "timeEstimate", "copilotTips"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini model.");
      }

      return NextResponse.json(JSON.parse(responseText));
    } 
    
    if (action === "refine-description") {
      if (!projectDescription) {
        return NextResponse.json({ error: "projectDescription is required to refine" }, { status: 400 });
      }

      const prompt = `Melhore e refine a seguinte descrição de projeto para que soe extremamente profissional, atraente para portfólios ou investidores, clara e objetiva. Mantenha o tom profissional e direto ao ponto.
Título do Projeto: ${projectTitle || "Sem título"}
Descrição original: ${projectDescription}

Gere uma descrição curta refinada de no máximo 3 ou 4 frases. Responda em português de forma direta.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Você é um redator técnico e especialista em pitch de projetos. Sua tarefa é reescrever a descrição para torná-la limpa, profissional e inspiradora.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              refinedDescription: {
                type: Type.STRING,
                description: "A descrição do projeto reescrita de maneira polida e profissional",
              },
            },
            required: ["refinedDescription"],
          },
        },
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("Empty response from Gemini model.");
      }

      return NextResponse.json(JSON.parse(responseText));
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return NextResponse.json(
      { 
        error: "Erro ao processar requisição com a IA", 
        details: error.message || error 
      },
      { status: 500 }
    );
  }
}
