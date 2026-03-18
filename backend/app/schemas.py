from pydantic import BaseModel, Field


class Analysis(BaseModel):
    industry: str
    concept: str
    colors: list[str]
    mood: str
    target: str
    logo_type: str = Field(alias="logoType", default="combination")

    model_config = {"populate_by_name": True}


class AnalyzeRequest(BaseModel):
    briefText: str = Field(max_length=5000)
    companyName: str = Field(max_length=100)


class GeneratePromptsRequest(BaseModel):
    analysis: Analysis


class GeneratePromptsResponse(BaseModel):
    prompts: list[str]


class GenerateLogosRequest(BaseModel):
    prompts: list[str]


class GenerateLogosResponse(BaseModel):
    logos: list[str]


class GenerateProposalRequest(BaseModel):
    analysis: Analysis
    selectedPrompt: str


class GenerateProposalResponse(BaseModel):
    proposal: str


class FetchUrlRequest(BaseModel):
    url: str


class FetchUrlResponse(BaseModel):
    text: str
