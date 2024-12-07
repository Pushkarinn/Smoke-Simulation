#ifndef COMPUTE_SHADER_HPP
#define COMPUTE_SHADER_HPP

#include "shader.hpp"

class ComputeShader {
public:
    ComputeShader() : programID(0) {}

    bool init(const std::string& filePath, int dimXZ, int dimY) {

        this->dimXZ = dimXZ;
        this->dimY = dimY;

        if (programID) destroy();

        programID = glCreateProgram();

        loadShader(programID, GL_COMPUTE_SHADER, filePath.c_str());

        if (programID != 0) {
            glLinkProgram(programID);
            return true;
        }

        return false;
    }

    void destroy() {
        if (programID) {
            glDeleteProgram(programID);
        }
    }

    void use() {
        if (programID) {
            glUseProgram(programID);
        }
    }

    void run() {
        if (programID) {
            glDispatchCompute(dimXZ / 8, dimY / 8, dimXZ / 8);
            glMemoryBarrier(GL_SHADER_IMAGE_ACCESS_BARRIER_BIT);
        }
    }

    GLuint id() const {
        return programID;
    }

private:
    GLuint programID;
    int dimXZ;
    int dimY;
};

#endif // COMPUTE_SHADER_HPP